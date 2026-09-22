const { getConnection } = require('./db');
const sql = require('mssql');

async function populateFlashcards() {
    try {
        const pool = await getConnection();
        
        // 1. Get dictionary items
        const dictRes = await pool.request().query('SELECT IdItem FROM Diccionario');
        const items = dictRes.recordset;
        
        // 2. Get mazos
        const mazoRes = await pool.request().query('SELECT IdMazo FROM MazosFlashcards');
        const mazos = mazoRes.recordset;
        
        if (items.length > 0 && mazos.length > 0) {
            let flashcardsCount = 0;
            // Distribute items into mazos (e.g. 5 per mazo)
            const transaction = new sql.Transaction(pool);
            await transaction.begin();
            
            try {
                let itemIdx = 0;
                for (let i = 0; i < mazos.length; i++) {
                    const mazo = mazos[i];
                    for (let j = 0; j < 5; j++) {
                        if (itemIdx >= items.length) break;
                        const item = items[itemIdx];
                        
                        await transaction.request()
                            .input('IdMazo', sql.Int, mazo.IdMazo)
                            .input('IdItem', sql.Int, item.IdItem)
                            .input('OrdenEnMazo', sql.Int, j + 1)
                            .query(`
                                INSERT INTO Flashcards (IdMazo, IdItem, OrdenEnMazo, TipoFlashcard)
                                VALUES (@IdMazo, @IdItem, @OrdenEnMazo, 'BASICA')
                            `);
                            
                        flashcardsCount++;
                        itemIdx++;
                    }
                }
                
                await transaction.commit();
                console.log(`Se insertaron ${flashcardsCount} flashcards exitosamente.`);
            } catch (err) {
                await transaction.rollback();
                console.error('Error insertando, haciendo rollback:', err);
            }
        }
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

populateFlashcards();
