// Script pour créer un utilisateur test via Supabase Admin API
// Vous devez avoir votre SUPABASE_ADMIN_KEY (visible dans Settings > API)

const supabaseUrl = "https://oxntkxxljrstaonxdcpo.supabase.co";
const supabaseAdminKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94bnRreHhsanJzdGFvbnhkY3BvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTkzMjczNzgsImV4cCI6MjAzNDkwMzM3OH0.T4-jh9FzB7-Q12e3G1j-u9s6jF5K2pL8mN3aR4s5tU0"; // À remplacer par votre ADMIN KEY

async function createTestUser() {
  const email = `vendeur${Math.random().toString(36).substr(2, 9)}@gmail.com`;
  const password = "vendeur123";

  try {
    console.log("🚀 Création utilisateur via Admin API...\n");

    // Créer l'utilisateur via Admin API
    const createUserResponse = await fetch(
      `${supabaseUrl}/auth/v1/admin/users`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseAdminKey}`,
        },
        body: JSON.stringify({
          email,
          password,
          email_confirm: true,
        }),
      },
    );

    if (!createUserResponse.ok) {
      const error = await createUserResponse.json();
      console.error("❌ Erreur création utilisateur:", error);
      return;
    }

    const authUser = await createUserResponse.json();
    console.log("✅ Utilisateur Supabase Auth créé:");
    console.log(`   Email: ${email}`);
    console.log(`   UUID: ${authUser.id}\n`);

    // Créer le profil dans la table users
    const profileResponse = await fetch(`${supabaseUrl}/rest/v1/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseAdminKey}`,
        apikey: supabaseAdminKey,
      },
      body: JSON.stringify({
        auth_uid: authUser.id,
        name: "Vendeur Test",
        email,
        phone: "+242061234567",
        role: "vendeur",
        subscription_status: "free",
        priority_level: 1,
        is_active: true,
      }),
    });

    if (!profileResponse.ok) {
      const error = await profileResponse.json();
      console.error("❌ Erreur création profil:", error);
      return;
    }

    console.log("✅ Profil créé dans la table users\n");
    console.log("📝 Identifiants de test:");
    console.log(`   Email: ${email}`);
    console.log(`   Mot de passe: ${password}`);
    console.log(
      "\n💡 Mettez à jour les placeholders dans App.jsx avec ces identifiants",
    );
  } catch (error) {
    console.error("❌ Erreur:", error.message);
  }
}

createTestUser();
