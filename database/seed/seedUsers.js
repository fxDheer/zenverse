const mongoose = require('mongoose');
const path = require('path');

// Add server directory to module path
const serverPath = path.join(__dirname, '../../server');
require('module').globalPaths.push(serverPath);

const User = require('../../server/models/User');
const Profile = require('../../server/models/Profile');
const { connectDB, disconnectDB } = require('../mongo');

// 30 AI-driven dummy profiles (15 male + 15 female)
const dummyProfiles = [
  // FEMALE PROFILES (15)
  {
    name: "Emma Wilson",
    age: 25,
    gender: "female",
    bio: "Adventure seeker and coffee enthusiast ☕️ Love hiking, photography, and trying new restaurants. Looking for someone who shares my passion for life!",
    interests: ["Hiking", "Photography", "Coffee", "Travel", "Cooking"],
    occupation: "Marketing Manager",
    education: "Bachelor's in Business",
    location: { type: "Point", coordinates: [-74.006, 40.7128] }, // NYC
    personality: "friendly",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400"
  },
  {
    name: "Sophia Chen",
    age: 28,
    gender: "female",
    bio: "Tech geek by day, yoga instructor by night 🧘‍♀️ Passionate about mindfulness and innovation. Let's build something amazing together!",
    interests: ["Yoga", "Technology", "Meditation", "Reading", "Fitness"],
    occupation: "Software Engineer",
    education: "Master's in Computer Science",
    location: { type: "Point", coordinates: [-122.4194, 37.7749] }, // San Francisco
    personality: "intellectual",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400"
  },
  {
    name: "Isabella Rodriguez",
    age: 23,
    gender: "female",
    bio: "Artist and dreamer 🎨 Love creating beauty in everything I do. Looking for someone who appreciates art and adventure!",
    interests: ["Art", "Painting", "Museums", "Travel", "Music"],
    occupation: "Graphic Designer",
    education: "Bachelor's in Fine Arts",
    location: { type: "Point", coordinates: [-118.2437, 34.0522] }, // Los Angeles
    personality: "flirty",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400"
  },
  {
    name: "Olivia Thompson",
    age: 26,
    gender: "female",
    bio: "Fitness trainer and nutrition enthusiast 💪 Love helping others achieve their goals. Let's motivate each other!",
    interests: ["Fitness", "Nutrition", "Running", "Healthy Living", "Motivation"],
    occupation: "Personal Trainer",
    education: "Bachelor's in Exercise Science",
    location: { type: "Point", coordinates: [-87.6298, 41.8781] }, // Chicago
    personality: "casual",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400"
  },
  {
    name: "Ava Johnson",
    age: 24,
    gender: "female",
    bio: "Bookworm and nature lover 📚🌿 Love quiet evenings with a good book and weekend hikes. Seeking someone who values deep conversations!",
    interests: ["Reading", "Hiking", "Nature", "Writing", "Tea"],
    occupation: "Librarian",
    education: "Master's in Library Science",
    location: { type: "Point", coordinates: [-75.1652, 39.9526] }, // Philadelphia
    personality: "intellectual",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"
  },
  {
    name: "Mia Davis",
    age: 27,
    gender: "female",
    bio: "Chef and food blogger 👩‍🍳 Love creating delicious meals and sharing recipes. Looking for someone who appreciates good food and good company!",
    interests: ["Cooking", "Food", "Travel", "Photography", "Wine"],
    occupation: "Chef",
    education: "Culinary Institute",
    location: { type: "Point", coordinates: [-80.1918, 25.7617] }, // Miami
    personality: "friendly",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400"
  },
  {
    name: "Charlotte Brown",
    age: 29,
    gender: "female",
    bio: "Doctor with a heart of gold 👩‍⚕️💕 Love helping others and making a difference. Seeking someone who values compassion and growth!",
    interests: ["Medicine", "Helping Others", "Travel", "Reading", "Yoga"],
    occupation: "Physician",
    education: "Medical Doctor",
    location: { type: "Point", coordinates: [-95.3698, 29.7604] }, // Houston
    personality: "friendly",
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400"
  },
  {
    name: "Amelia Miller",
    age: 25,
    gender: "female",
    bio: "Musician and music teacher 🎵 Love playing piano and teaching others. Looking for someone who shares my passion for music!",
    interests: ["Music", "Piano", "Teaching", "Concerts", "Composing"],
    occupation: "Music Teacher",
    education: "Bachelor's in Music",
    location: { type: "Point", coordinates: [-84.3880, 33.7490] }, // Atlanta
    personality: "flirty",
    avatar: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400"
  },
  {
    name: "Harper Garcia",
    age: 26,
    gender: "female",
    bio: "Environmental scientist and activist 🌍 Passionate about saving the planet. Let's make the world a better place together!",
    interests: ["Environment", "Science", "Activism", "Hiking", "Sustainability"],
    occupation: "Environmental Scientist",
    education: "Master's in Environmental Science",
    location: { type: "Point", coordinates: [-122.6765, 45.5152] }, // Portland
    personality: "intellectual",
    avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400"
  },
  {
    name: "Evelyn Martinez",
    age: 24,
    gender: "female",
    bio: "Dance instructor and performer 💃 Love expressing myself through movement. Looking for someone who appreciates creativity and passion!",
    interests: ["Dance", "Performance", "Fitness", "Music", "Art"],
    occupation: "Dance Instructor",
    education: "Bachelor's in Dance",
    location: { type: "Point", coordinates: [-104.9903, 39.7392] }, // Denver
    personality: "flirty",
    avatar: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400"
  },
  {
    name: "Abigail Anderson",
    age: 28,
    gender: "female",
    bio: "Lawyer and justice seeker ⚖️ Passionate about helping others and fighting for what's right. Seeking someone with strong values!",
    interests: ["Law", "Justice", "Reading", "Debate", "Travel"],
    occupation: "Attorney",
    education: "Juris Doctor",
    location: { type: "Point", coordinates: [-77.0369, 38.9072] }, // Washington DC
    personality: "intellectual",
    avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400"
  },
  {
    name: "Emily Taylor",
    age: 25,
    gender: "female",
    bio: "Fashion designer and style enthusiast 👗 Love creating beautiful things and helping people feel confident. Let's create something beautiful together!",
    interests: ["Fashion", "Design", "Style", "Art", "Shopping"],
    occupation: "Fashion Designer",
    education: "Bachelor's in Fashion Design",
    location: { type: "Point", coordinates: [-74.006, 40.7128] }, // NYC
    personality: "flirty",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400"
  },
  {
    name: "Elizabeth White",
    age: 27,
    gender: "female",
    bio: "Psychologist and mental health advocate 🧠 Love helping people understand themselves better. Seeking someone who values emotional intelligence!",
    interests: ["Psychology", "Mental Health", "Helping Others", "Reading", "Meditation"],
    occupation: "Psychologist",
    education: "Ph.D. in Psychology",
    location: { type: "Point", coordinates: [-87.6298, 41.8781] }, // Chicago
    personality: "friendly",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400"
  },
  {
    name: "Sofia Clark",
    age: 24,
    gender: "female",
    bio: "Veterinarian and animal lover 🐾 Passionate about caring for animals and their families. Looking for someone who shares my love for furry friends!",
    interests: ["Animals", "Veterinary Medicine", "Nature", "Hiking", "Photography"],
    occupation: "Veterinarian",
    education: "Doctor of Veterinary Medicine",
    location: { type: "Point", coordinates: [-122.4194, 37.7749] }, // San Francisco
    personality: "friendly",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400"
  },
  {
    name: "Avery Lewis",
    age: 26,
    gender: "female",
    bio: "Architect and creative problem solver 🏗️ Love designing spaces that inspire and bring people together. Let's build something amazing!",
    interests: ["Architecture", "Design", "Art", "Travel", "Photography"],
    occupation: "Architect",
    education: "Master's in Architecture",
    location: { type: "Point", coordinates: [-118.2437, 34.0522] }, // Los Angeles
    personality: "intellectual",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400"
  },

  // MALE PROFILES (15)
  {
    name: "James Smith",
    age: 27,
    gender: "male",
    bio: "Software engineer and tech enthusiast 💻 Love coding, gaming, and exploring new technologies. Looking for someone who shares my curiosity!",
    interests: ["Technology", "Gaming", "Coding", "AI", "Innovation"],
    occupation: "Software Engineer",
    education: "Bachelor's in Computer Science",
    location: { type: "Point", coordinates: [-122.4194, 37.7749] }, // San Francisco
    personality: "intellectual",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"
  },
  {
    name: "Robert Johnson",
    age: 29,
    gender: "male",
    bio: "Financial analyst and investment guru 📈 Love helping people build wealth and achieve their financial goals. Seeking someone with ambition!",
    interests: ["Finance", "Investing", "Business", "Reading", "Travel"],
    occupation: "Financial Analyst",
    education: "Master's in Finance",
    location: { type: "Point", coordinates: [-74.006, 40.7128] }, // NYC
    personality: "intellectual",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400"
  },
  {
    name: "Michael Williams",
    age: 25,
    gender: "male",
    bio: "Personal trainer and fitness coach 💪 Love helping others transform their lives through fitness. Let's get strong together!",
    interests: ["Fitness", "Training", "Nutrition", "Motivation", "Sports"],
    occupation: "Personal Trainer",
    education: "Bachelor's in Exercise Science",
    location: { type: "Point", coordinates: [-87.6298, 41.8781] }, // Chicago
    personality: "casual",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400"
  },
  {
    name: "David Brown",
    age: 28,
    gender: "male",
    bio: "Chef and food lover 👨‍🍳 Passionate about creating amazing culinary experiences. Looking for someone who appreciates good food and good company!",
    interests: ["Cooking", "Food", "Wine", "Travel", "Photography"],
    occupation: "Executive Chef",
    education: "Culinary Institute",
    location: { type: "Point", coordinates: [-80.1918, 25.7617] }, // Miami
    personality: "friendly",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"
  },
  {
    name: "Richard Jones",
    age: 26,
    gender: "male",
    bio: "Musician and band leader 🎸 Love creating music and performing live. Looking for someone who shares my passion for music and creativity!",
    interests: ["Music", "Guitar", "Performing", "Songwriting", "Concerts"],
    occupation: "Musician",
    education: "Bachelor's in Music",
    location: { type: "Point", coordinates: [-118.2437, 34.0522] }, // Los Angeles
    personality: "flirty",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400"
  },
  {
    name: "Thomas Garcia",
    age: 30,
    gender: "male",
    bio: "Doctor and healthcare advocate 👨‍⚕️ Passionate about helping others and making a difference in people's lives. Seeking someone with compassion!",
    interests: ["Medicine", "Healthcare", "Helping Others", "Travel", "Reading"],
    occupation: "Physician",
    education: "Medical Doctor",
    location: { type: "Point", coordinates: [-95.3698, 29.7604] }, // Houston
    personality: "friendly",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400"
  },
  {
    name: "Christopher Miller",
    age: 27,
    gender: "male",
    bio: "Architect and design enthusiast 🏛️ Love creating beautiful spaces that inspire and bring people together. Let's design something amazing!",
    interests: ["Architecture", "Design", "Art", "Travel", "Photography"],
    occupation: "Architect",
    education: "Master's in Architecture",
    location: { type: "Point", coordinates: [-84.3880, 33.7490] }, // Atlanta
    personality: "intellectual",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"
  },
  {
    name: "Daniel Davis",
    age: 24,
    gender: "male",
    bio: "Photographer and visual storyteller 📸 Love capturing beautiful moments and telling stories through images. Looking for someone who appreciates art!",
    interests: ["Photography", "Art", "Travel", "Storytelling", "Nature"],
    occupation: "Photographer",
    education: "Bachelor's in Photography",
    location: { type: "Point", coordinates: [-122.6765, 45.5152] }, // Portland
    personality: "casual",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400"
  },
  {
    name: "Matthew Rodriguez",
    age: 29,
    gender: "male",
    bio: "Lawyer and justice seeker ⚖️ Passionate about fighting for what's right and helping others. Seeking someone with strong values and integrity!",
    interests: ["Law", "Justice", "Debate", "Reading", "Travel"],
    occupation: "Attorney",
    education: "Juris Doctor",
    location: { type: "Point", coordinates: [-77.0369, 38.9072] }, // Washington DC
    personality: "intellectual",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400"
  },
  {
    name: "Anthony Wilson",
    age: 25,
    gender: "male",
    bio: "Teacher and education advocate 📚 Love inspiring young minds and making learning fun. Looking for someone who values education and growth!",
    interests: ["Teaching", "Education", "Reading", "Travel", "Learning"],
    occupation: "High School Teacher",
    education: "Master's in Education",
    location: { type: "Point", coordinates: [-74.006, 40.7128] }, // NYC
    personality: "friendly",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"
  },
  {
    name: "Mark Anderson",
    age: 28,
    gender: "male",
    bio: "Entrepreneur and business innovator 💼 Love building companies and solving problems. Seeking someone who shares my drive and ambition!",
    interests: ["Business", "Entrepreneurship", "Innovation", "Technology", "Networking"],
    occupation: "Entrepreneur",
    education: "MBA",
    location: { type: "Point", coordinates: [-122.4194, 37.7749] }, // San Francisco
    personality: "intellectual",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400"
  },
  {
    name: "Donald Taylor",
    age: 26,
    gender: "male",
    bio: "Firefighter and community hero 🚒 Passionate about helping others and keeping our community safe. Looking for someone who values courage and service!",
    interests: ["Firefighting", "Community Service", "Fitness", "Adventure", "Helping Others"],
    occupation: "Firefighter",
    education: "Fire Science Degree",
    location: { type: "Point", coordinates: [-87.6298, 41.8781] }, // Chicago
    personality: "casual",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400"
  },
  {
    name: "Steven Thomas",
    age: 27,
    gender: "male",
    bio: "Environmental scientist and nature lover 🌿 Passionate about protecting our planet and exploring the great outdoors. Let's save the world together!",
    interests: ["Environment", "Science", "Hiking", "Nature", "Sustainability"],
    occupation: "Environmental Scientist",
    education: "Master's in Environmental Science",
    location: { type: "Point", coordinates: [-104.9903, 39.7392] }, // Denver
    personality: "friendly",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"
  },
  {
    name: "Paul Jackson",
    age: 24,
    gender: "male",
    bio: "Dance instructor and performer 🕺 Love expressing myself through movement and teaching others to dance. Looking for someone who appreciates creativity!",
    interests: ["Dance", "Performance", "Music", "Fitness", "Art"],
    occupation: "Dance Instructor",
    education: "Bachelor's in Dance",
    location: { type: "Point", coordinates: [-80.1918, 25.7617] }, // Miami
    personality: "flirty",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400"
  },
  {
    name: "Andrew White",
    age: 29,
    gender: "male",
    bio: "Psychologist and mental health advocate 🧠 Love helping people understand themselves and find happiness. Seeking someone who values emotional intelligence!",
    interests: ["Psychology", "Mental Health", "Helping Others", "Reading", "Meditation"],
    occupation: "Psychologist",
    education: "Ph.D. in Psychology",
    location: { type: "Point", coordinates: [-84.3880, 33.7490] }, // Atlanta
    personality: "intellectual",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400"
  }
];

// Seed the database with dummy users
const seedUsers = async () => {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await connectDB();
    
    // Clear existing users and profiles
    await User.deleteMany({});
    await Profile.deleteMany({});
    console.log('🗑️ Cleared existing data');
    
    const createdUsers = [];
    
    // Create users and profiles
    for (const profileData of dummyProfiles) {
      // Create user account
      const user = new User({
        email: `${profileData.name.toLowerCase().replace(' ', '.')}@zenverse.ai`,
        password: 'password123', // Will be hashed by pre-save hook
        name: profileData.name,
        role: 'user',
        isVerified: true,
        isActive: true,
        lastActive: new Date(),
        avatar: profileData.avatar,
        preferences: {
          ageRange: { min: 20, max: 35 },
          distance: 50,
          gender: profileData.gender === 'female' ? 'male' : 'female'
        },
        premium: false
      });
      
      const savedUser = await user.save();
      
      // Create detailed profile
      const profile = new Profile({
        userId: savedUser._id,
        name: profileData.name,
        age: profileData.age,
        bio: profileData.bio,
        avatar: profileData.avatar,
        photos: [{ url: profileData.avatar, caption: 'Profile photo', isPrimary: true }],
        location: profileData.location,
        interests: profileData.interests,
        occupation: profileData.occupation,
        education: profileData.education,
        height: Math.floor(Math.random() * 20) + 150, // 150-170 cm
        bodyType: ['slim', 'athletic', 'average', 'curvy'][Math.floor(Math.random() * 4)],
        relationshipStatus: 'single',
        lookingFor: 'serious-relationship',
        hasChildren: 'no',
        wantsChildren: Math.random() > 0.5 ? 'yes' : 'no',
        smoking: 'no',
        drinking: ['no', 'occasionally', 'yes'][Math.floor(Math.random() * 3)],
        religion: ['Spiritual', 'Atheist', 'Christian', 'Other'][Math.floor(Math.random() * 4)],
        languages: ['English'],
        socialLinks: {},
        isComplete: true,
        isPublic: true,
        lastUpdated: new Date()
      });
      
      await profile.save();
      createdUsers.push({ user: savedUser, profile });
      
      console.log(`✅ Created profile for ${profileData.name}`);
    }
    
    console.log(`🎉 Successfully seeded ${createdUsers.length} users!`);
    console.log('📊 Summary:');
    console.log(`   - Female profiles: ${createdUsers.filter(u => u.profile.gender === 'female').length}`);
    console.log(`   - Male profiles: ${createdUsers.filter(u => u.profile.gender === 'male').length}`);
    
    return createdUsers;
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await disconnectDB();
  }
};

// Run seeding if called directly
if (require.main === module) {
  seedUsers()
    .then(() => {
      console.log('✅ Database seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedUsers, dummyProfiles }; 