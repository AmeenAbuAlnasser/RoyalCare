const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
p.centerUser.findFirst({
  where: { centerId: "17c0114c-0c7a-4a72-9944-a01263d6cecf" },
  include: { role: true }
}).then(u => {
  console.log(JSON.stringify({ id: u.id, email: u.email, roleKey: u.role.key }));
  return p.$disconnect();
}).catch(e => { console.error(e.message); process.exit(1); });
