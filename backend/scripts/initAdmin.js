// require('dotenv').config();
// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');
// const User = require('../models/User');

// const initAdmin = async () => {
//   try {
//     // Connexion à MongoDB
//     await mongoose.connect(process.env.MONGODB_URI, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });

//     console.log('Connexion à MongoDB réussie');

//     // Vérifier si l'admin existe déjà
//     const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL });
    
//     if (adminExists) {
//       console.log('Un administrateur avec cet email existe déjà');
//       process.exit(0);
//     }

//     // Créer l'administrateur
//     const hashedPassword = await bcrypt.hash('admin123', 10);
    
//     const admin = new User({
//       name: 'Administrateur',
//       email: process.env.ADMIN_EMAIL,
//       phoneNumber: process.env.ADMIN_PHONE,
//       password: hashedPassword,
//       role: 'admin',
//       isVerified: true,
//       isActive: true
//     });

//     await admin.save();
    
//     console.log(' Administrateur créé avec succès');
//     console.log(`Email: ${process.env.ADMIN_EMAIL}`);
//     console.log('Mot de passe temporaire: admin123');
//     console.log('\n Changez ce mot de passe immédiatement après la première connexion');
    
//     process.exit(0);
//   } catch (error) {
//     console.error('Erreur lors de l\'initialisation de l\'administrateur:', error);
//     process.exit(1);
//   }
// };

// initAdmin();
