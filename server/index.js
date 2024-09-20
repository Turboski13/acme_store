const {
    client,
    createTables,
    createUser,
    createProduct,
    fetchUsers,
    fetchProducts,
    fetchFavorites,
    createFavorite,
    destroyFavorite
  } = require('./db');
  const express = require('express');
const app = express(); 

app.get('/api/users', async (req, res) => {
  const response = await client.query("SELECT * FROM Users");
  res.json(response.rows);
})

app.post('/api/users', async (req, res) => {
  const { id, name, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  await client.query("INSERT INTO Users (id,name,password) VALUES ($1, $2, $3)", [id, name, hashedPassword]);
  res.json('User created');
})

app.post('/api/login', async (req, res) => {
  const { name, password } = req.body;
  const user = await client.query("SELECT * from Users WHERE name = $1", [name]);
  const isPassowrdMatching = await bcrypt.compare(password, user.rows[0].password);
  if (isPassowrdMatching) {
      res.json('Login successful');
  } else {
      res.json('Login failed');
  }
})


app.get('/api/product', async(req, res, next)=> {
    try {
      res.send(await fetchProducts());
    }
    catch(ex){
      next(ex);
    }
  });

app.get('/api/users/:id/favorite', async(req, res, next)=> {
    try {
      res.send(await fetchFavorites(req.params.id));
    }
    catch(ex){
      next(ex);
    }
  });

app.post('/api/users/:id/favorite', async(req, res, next)=> {
    try {
      res.status(201).send(await createFavorite({ user_id: req.params.id, skill_id: req.body.skill_id}));
    }
    catch(ex){
      next(ex);
    }
  });
  
app.delete('/api/users/:userId/favorite/:id', async(req, res, next)=> {
    try {
      await destroyFavorite({ id: req.params.id, user_id: req.params.userId });
      res.sendStatus(204);
    }
    catch(ex){
      next(ex);
    }
  });

const init = async()=> {
    await client.connect();
    console.log('connected to database');
    await createTables();
    console.log('tables created');
    const [ricky, jimmy, ester, alli, vinylrecord, rollerskates, legwarmers, bubblegum] = await Promise.all([
      createUser({ username: 'Ricky', password: 'StevieRay7' }),
      createUser({ username: 'Jimmy', password: 'Tacos4Lyfe!!' }),
      createUser({ username: 'Ester', password: 'Q1W2e3e4N$' }),
      createUser({ username: 'Alli', password: 'FroBro<3' }),
      createProduct({ name: 'Vinyl Record'}),
      createProduct({ name: 'Rollerskates'}),
      createProduct({ name: 'Legwarmers'}),
      createProduct({ name: 'Bubblegum'}),
    ]);
    const users = await fetchUsers();
    console.log(users);
  
    const skills = await fetchProducts();
    console.log(skills);
  
    const userFavorite = await Promise.all([
        createFavorite({ user_id: ricky.id, product_id: vinylrecord.id}),
        createFavorite({ user_id: ester.id, product_id: legwarmers.id}),
        createFavorite({ user_id: jimmy.id, product_id: bubblegum.id}),
        createFavorite({ user_id: alli.id, product_id: rollerskates.id})
      ]);
    
      console.log(await fetchFavorites(alli.id));
      await deleteFavorite({ user_id: alli.id, id: userFavorite[3].id});
      console.log(await fetchUserSkills(alli.id));
    
      console.log(`curl localhost:3000/api/users/${ester.id}/favorite`);
    
      console.log(`curl -X POST localhost:3000/api/users/${ester.id}/userFavorite -d '{"product_id": "${legwarmers.id}"}' -H 'Content-Type:application/json'`);
      console.log(`curl -X DELETE localhost:3000/api/users/${ester.id}/userFavorite/${userFavorite[1].id}`);
      
      console.log('data seeded');
    
      const port = process.env.PORT || 3000;
      app.listen(port, ()=> console.log(`listening on port ${port}`));
    };
    
    init();

   