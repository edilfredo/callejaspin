export default function DataTable({ columns, data, loading, onEdit, onDelete, onToggleStatus }) {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-100">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 font-medium text-slate-700">
                {col.label}
              </th>
            ))}
            {(onEdit || onDelete || onToggleStatus) && <th className="px-4 py-3 font-medium text-slate-700">Acciones</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-slate-500">
                No hay registros
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={row.id || i} className="hover:bg-slate-50">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    {col.render ? col.render(row) : row[col.key] ?? '-'}
                  </td>
                ))}
                {(onEdit || onDelete || onToggleStatus) && (
                  <td className="px-4 py-3 space-x-2">
                    {onEdit && (
                      <button onClick={() => onEdit(row)} className="text-blue-600 hover:underline text-xs">
                        Editar
                      </button>
                    )}
                    {onToggleStatus && (
                      <button onClick={() => onToggleStatus(row)} className={`hover:underline text-xs ${row.estado === 'ACTIVO' ? 'text-red-600' : 'text-green-600'}`}>
                        {row.estado === 'ACTIVO' ? 'Desactivar' : 'Activar'}
                      </button>
                    )}
                    {onDelete && (
                      <button onClick={() => onDelete(row)} className="text-red-600 hover:underline text-xs">
                        Eliminar
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
