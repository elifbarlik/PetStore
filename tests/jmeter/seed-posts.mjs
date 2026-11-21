// Seeds (or removes) a realistic data set for the JMeter load test.
//   node jmeter/seed-posts.mjs seed [count]   -> creates a user with <count> posts (default 50)
//   node jmeter/seed-posts.mjs clean          -> deletes the posts created by "seed"
// The seeded user's credentials are kept in jmeter/results/seed-state.json (git-ignored).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const API = process.env.API_URL ?? 'http://localhost:5294/api';
const stateFile = path.join(here, 'results', 'seed-state.json');
const [, , command = 'seed', countArg = '50'] = process.argv;

const json = async (res) => {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${res.status} ${res.url}: ${body.message ?? ''}`);
  return body;
};

const login = async ({ userName, password }) =>
  (await json(await fetch(`${API}/user/Login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userName, password }),
  }))).result.token;

if (command === 'seed') {
  const id = Date.now().toString(36);
  const user = { name: 'Load', surname: 'Test', userName: `load_${id}`, email: `load_${id}@petstore.test`, password: 'Test1234!' };
  const reg = await json(await fetch(`${API}/user/Register`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(user),
  }));
  const token = await login(user);
  const types = ['Kedi', 'Köpek', 'Kuş', 'Tavşan'];
  const postIds = [];
  for (let i = 0; i < Number(countArg); i++) {
    const params = new URLSearchParams({
      UserId: reg.result.id,
      Title: `Yük testi ilanı ${i + 1}`,
      PetName: `Pati ${i + 1}`,
      PetType: types[i % types.length],
      Description: 'JMeter yük testi için oluşturulan örnek ilan açıklaması. '.repeat(3).trim(),
    });
    const body = await json(await fetch(`${API}/post/CreatePost?${params}`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: new FormData(),
    }));
    postIds.push(body.result.postId);
  }
  fs.mkdirSync(path.dirname(stateFile), { recursive: true });
  fs.writeFileSync(stateFile, JSON.stringify({ user, postIds }, null, 2));
  console.log(`Seeded ${postIds.length} posts for ${user.userName}`);
} else if (command === 'clean') {
  if (!fs.existsSync(stateFile)) {
    console.log('Nothing to clean.');
    process.exit(0);
  }
  const { user, postIds } = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  const token = await login(user);
  for (const id of postIds) {
    await fetch(`${API}/post/DeletePost/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
  }
  fs.rmSync(stateFile);
  console.log(`Deleted ${postIds.length} seeded posts`);
} else {
  console.error(`Unknown command "${command}". Use "seed" or "clean".`);
  process.exit(1);
}
