// Script pour créer les utilisateurs test
// Usage: node setup-users.js

import { registerUser } from "./src/supabase.js";

const testUsers = [
  {
    name: "Vendeur Test",
    email: "vendeur" + Math.random().toString(36).substring(7) + "@outlook.com",
    phone: "+242061234567",
    password: "test123456",
  },
];

async function setupTestUsers() {
  console.log("🚀 Création des utilisateurs test...\n");

  for (const user of testUsers) {
    try {
      console.log(`➡️ Création: ${user.email}`);
      const result = await registerUser(
        user.name,
        user.email,
        user.phone,
        user.password,
      );

      if (result.success) {
        console.log(`✅ Succès: ${user.name} créé\n`);
        console.log("📝 Identifiants créés:");
        console.log(`   Email: ${user.email}`);
        console.log(`   Mot de passe: ${user.password}\n`);
        console.log(
          "💡 Mettez à jour les credentials dans App.jsx avec ces identifiants",
        );
      } else {
        console.log(`❌ Erreur: ${result.error}\n`);
      }
    } catch (error) {
      console.error(`❌ Erreur: ${error.message}\n`);
    }
  }

  console.log("✨ Initialisation terminée");
}

setupTestUsers();
