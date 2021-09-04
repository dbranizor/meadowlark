const buildSchema = (data) => {
  return Object.keys(data).reduce((acc, curr) => {
    const tableNames = Object.keys(data[curr]);
    const tableValues = Object.values(data[curr]);
    const statement = tableNames.reduce((acc, curr, ix) => {
      if (ix === 0) {
        acc = `CREATE TABLE IF NOT EXISTS (`;
        
      }
      
      if(ix === tableNames.length - 1){
        acc = `${acc} ${curr} ${tableValues[ix]})`;
      } else {
        acc = `${acc} ${curr} ${tableValues[ix]},`;
      }
      
      return acc;
    }, "");
    acc[curr] = statement;
    return acc;
  }, {});
};

export { buildSchema };
