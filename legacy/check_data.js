const { getConnection } = require('./db');

async function checkData() {
    try {
        const pool = await getConnection();
        const mazos = await pool.request().query('SELECT * FROM MazosFlashcards');
        console.log('Mazos:', mazos.recordset.length);
        
        const dict = await pool.request().query('SELECT * FROM Diccionario');
        console.log('Diccionario:', dict.recordset.length);

        const flashcards = await pool.request().query('SELECT * FROM Flashcards');
        console.log('Flashcards:', flashcards.recordset.length);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkData();
