// Utilidad de exportacion CSV (compartida por reclutas e intendentes).
function aCSV(filas, nombreArchivo) {
    const cabeceras = Object.keys(filas[0]).join(',');
    const filasCSV = filas.map((fila) => Object.values(fila).map((valor) => {
        const stringValor = valor !== null && valor !== undefined ? String(valor) : '';
        return `"${stringValor.replace(/"/g, '""')}"`;
    }).join(','));

    return {
        contenido: '\uFEFF' + [cabeceras, ...filasCSV].join('\n'),
        nombreArchivo,
    };
}

module.exports = { aCSV };
