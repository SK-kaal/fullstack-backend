const express = require('express');
const cors = require('cors');
const path = require('path');
const { ObjectId } = require('mongodb');
const config = require('./config');
const { connectToDatabase, getCollections, closeConnection } = require('./lib/mongo');

const app = express();

const corsOptions = {
  origin: (origin, callback) => {
    if (
      !origin ||
      config.allowedOrigins === '*' ||
      (Array.isArray(config.allowedOrigins) && config.allowedOrigins.includes(origin))
    ) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
};

app.use(cors(corsOptions));
app.use(express.json());

const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const elapsed = Date.now() - start;
    console.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${elapsed}ms`);
  });
  next();
};

app.use(requestLogger);

const imagesDir = path.join(__dirname, '..', 'public', 'images');
app.use('/images', express.static(imagesDir));
app.use('/images', (req, res) => {
  res.status(404).json({ error: 'Image not found' });
});

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/lessons', async (_req, res, next) => {
  try {
    const { classes } = getCollections();
    const docs = await classes.find().sort({ subject: 1 }).toArray();
    res.json(docs);
  } catch (error) {
    next(error);
  }
});

app.get('/search', async (req, res, next) => {
  try {
    const term = (req.query.q || '').trim();
    const { classes } = getCollections();

    if (!term) {
      const docs = await classes.find().sort({ subject: 1 }).toArray();
      return res.json(docs);
    }

    const escaped = escapeRegex(term);
    const regex = new RegExp(escaped, 'i');

    const matches = await classes
      .find({
        $or: [
          { subject: regex },
          { location: regex },
          {
            $expr: {
              $regexMatch: {
                input: { $toString: '$price' },
                regex: escaped,
                options: 'i',
              },
            },
          },
          {
            $expr: {
              $regexMatch: {
                input: { $toString: '$spaces' },
                regex: escaped,
                options: 'i',
              },
            },
          },
        ],
      })
      .toArray();

    res.json(matches);
  } catch (error) {
    next(error);
  }
});

const validateOrderPayload = (payload) => {
  const errors = [];

  const nameRegex = /^[a-zA-Z\s]+$/;
  const phoneRegex = /^[0-9]{6,}$/;

  if (!payload.name || !nameRegex.test(payload.name)) {
    errors.push('Name is required and must contain letters only.');
  }

  if (!payload.phone || !phoneRegex.test(payload.phone)) {
    errors.push('Phone is required and must contain digits only.');
  }

  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    errors.push('At least one item is required.');
  }

  const parsedItems = (payload.items || []).map((item, index) => {
    if (!item.classId) {
      errors.push(`Item ${index + 1} is missing classId.`);
      return null;
    }

    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      errors.push(`Item ${index + 1} must have a positive integer quantity.`);
      return null;
    }

    try {
      return {
        classId: new ObjectId(item.classId),
        quantity,
      };
    } catch (err) {
      errors.push(`Item ${index + 1} has an invalid classId.`);
      return null;
    }
  });

  if (errors.length) {
    const error = new Error(errors.join(' '));
    error.status = 400;
    throw error;
  }

  return {
    name: payload.name.trim(),
    phone: payload.phone.trim(),
    items: parsedItems,
  };
};

app.post('/orders', async (req, res, next) => {
  try {
    const order = validateOrderPayload(req.body);
    const { orders } = getCollections();

    const result = await orders.insertOne({
      ...order,
      createdAt: new Date(),
    });

    res.status(201).json({ orderId: result.insertedId });
  } catch (error) {
    next(error);
  }
});

const buildClassUpdates = (body) => {
  const allowedFields = ['subject', 'location', 'description', 'price', 'spaces', 'image'];
  const updates = {};

  allowedFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      updates[field] = body[field];
    }
  });

  if ('price' in updates) {
    const price = Number(updates.price);
    if (Number.isNaN(price) || price < 0) {
      const error = new Error('Price must be a positive number.');
      error.status = 400;
      throw error;
    }
    updates.price = price;
  }

  if ('spaces' in updates) {
    const spaces = Number(updates.spaces);
    if (!Number.isInteger(spaces) || spaces < 0) {
      const error = new Error('Spaces must be a non-negative integer.');
      error.status = 400;
      throw error;
    }
    updates.spaces = spaces;
  }

  return updates;
};

app.put('/lessons/:id', async (req, res, next) => {
  try {
    const updates = buildClassUpdates(req.body);
    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: 'No valid fields provided for update.' });
    }

    const classId = new ObjectId(req.params.id);
    const { classes } = getCollections();

    const result = await classes.findOneAndUpdate(
      { _id: classId },
      { $set: updates },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({ error: 'Class not found.' });
    }

    res.json(result.value);
  } catch (error) {
    if (error instanceof TypeError || error.name === 'BSONTypeError') {
      return res.status(400).json({ error: 'Invalid class ID supplied.' });
    }
    next(error);
  }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

async function start() {
  try {
    await connectToDatabase();
    const server = app.listen(config.port, () => {
      console.log(`Server listening on port ${config.port}`);
    });

    const shutdown = async () => {
      console.log('Shutting down server...');
      server.close(async () => {
        await closeConnection();
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
