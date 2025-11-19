const { MongoClient } = require('mongodb');
const config = require('../src/config');

const sampleClasses = [
  {
    subject: 'Creative Coding',
    location: 'Hendon',
    price: 95,
    spaces: 5,
    day: 'Monday',
    description: 'Introduce coding fundamentals through storytelling and art-focused projects.',
    image: '/images/placeholder.svg',
  },
  {
    subject: 'STEM Robotics',
    location: 'Colindale',
    price: 120,
    spaces: 5,
    day: 'Tuesday',
    description: 'Build simple robots while learning teamwork, problem solving, and circuitry.',
    image: '/images/placeholder.svg',
  },
  {
    subject: 'Digital Art Lab',
    location: 'Golders Green',
    price: 90,
    spaces: 5,
    day: 'Wednesday',
    description: 'Create animations and illustrations using tablets and beginner-friendly software.',
    image: '/images/placeholder.svg',
  },
  {
    subject: 'Mathematics Mastery',
    location: 'Brent Cross',
    price: 80,
    spaces: 5,
    day: 'Thursday',
    description: 'Strengthen numeracy skills with games, challenges, and real-world scenarios.',
    image: '/images/placeholder.svg',
  },
  {
    subject: 'Drama Club',
    location: 'Mill Hill',
    price: 85,
    spaces: 5,
    day: 'Friday',
    description: 'Build confidence through improv exercises, stagecraft, and mini performances.',
    image: '/images/placeholder.svg',
  },
  {
    subject: 'Music Ensemble',
    location: 'Hampstead',
    price: 110,
    spaces: 5,
    day: 'Monday',
    description: 'Explore rhythm and melody using percussion, keyboards, and voice.',
    image: '/images/placeholder.svg',
  },
  {
    subject: 'Young Scientists',
    location: 'Finchley',
    price: 105,
    spaces: 5,
    day: 'Tuesday',
    description: 'Hands-on experiments covering chemistry, physics, and environmental science.',
    image: '/images/placeholder.svg',
  },
  {
    subject: 'Chess Strategy',
    location: 'Cricklewood',
    price: 75,
    spaces: 5,
    day: 'Wednesday',
    description: 'Learn tactics, openings, and sportsmanship in a supportive environment.',
    image: '/images/placeholder.svg',
  },
  {
    subject: 'Outdoor Adventures',
    location: 'Regents Park',
    price: 130,
    spaces: 5,
    day: 'Thursday',
    description: 'Team challenges, navigation, and nature-based learning in local parks.',
    image: '/images/placeholder.svg',
  },
  {
    subject: 'Spanish for Kids',
    location: 'Kilburn',
    price: 88,
    spaces: 5,
    day: 'Friday',
    description: 'Songs, games, and conversational Spanish for complete beginners.',
    image: '/images/placeholder.svg',
  },
];

async function seed() {
  const client = new MongoClient(config.mongoUri);
  try {
    await client.connect();
    const db = client.db(config.dbName);
    const classes = db.collection('classes');
    const orders = db.collection('orders');

    try {
      await classes.dropIndex('id_1');
      console.log('Dropped legacy id_1 index');
    } catch (indexError) {
      if (indexError.codeName !== 'IndexNotFound') {
        throw indexError;
      }
    }

    await Promise.all([classes.deleteMany({}), orders.deleteMany({})]);
    await classes.insertMany(sampleClasses);

    console.log(`Seeded ${sampleClasses.length} classes and cleared previous orders.`);
  } catch (error) {
    console.error('Failed to seed database:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seed();
