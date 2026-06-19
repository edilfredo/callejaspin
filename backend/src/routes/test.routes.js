const router = require('express').Router();
const supabase = require('../config/supabase');

router.get('/db', async (req, res) => {

  const { data, error } = await supabase
    .from('categorias')
    .select('*');

  if(error){
    return res.status(500).json(error);
  }

  res.json(data);
});

module.exports = router;
