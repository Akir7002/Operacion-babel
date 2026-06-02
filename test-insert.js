// Prueba manual para validar transacciones e inserciones en Usuarios.
const { getConnection, sql } = require('./db');

async function testInsert() {
    try {
        const pool = await getConnection();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        
        try {
            // Inserta un registro de prueba y comprueba que la transaccion funcione.
            console.log('Inserting into Usuarios...');
            const usuarioInsert = await new sql.Request(transaction)
                .input('NombreClave', sql.NVarChar, 'TEST-1234')
                .input('HashContrasena', sql.NVarChar, 'abc')
                .input('IdIdiomaPreferido', sql.Int, 1)
                .query(`
                    INSERT INTO Usuarios (NombreClave, HashContrasena, IdIdiomaPreferido)
                    OUTPUT INSERTED.IdUsuario, INSERTED.NombreClave
                    VALUES (@NombreClave, @HashContrasena, @IdIdiomaPreferido);
                `);
            
            console.log('Inserted Usuario ID:', usuarioInsert.recordset[0].IdUsuario);
            
            await transaction.commit();
            console.log('Transaction committed successfully');
            
            // Verifica que el registro quede persistido tras el commit.
            const check = await pool.request().query('SELECT * FROM Usuarios WHERE NombreClave = \'TEST-1234\'');
            console.log('Rows in DB after commit:', check.recordset.length);
            
            process.exit(0);
        } catch (err) {
            console.error('Error in transaction:', err);
            await transaction.rollback();
            process.exit(1);
        }
    } catch (err) {
        console.error('Connection error:', err);
        process.exit(1);
    }
}

testInsert();
