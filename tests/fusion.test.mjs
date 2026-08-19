import test from 'node:test';
import assert from 'node:assert/strict';

import {
  fusionar,
  fusionarDiario,
  fusionarDias,
  fusionarHabitos,
  fusionarHabitosHechos,
} from '../src/services/fusion.js';

// Esta es la regla que protegen estas pruebas: sincronizar NUNCA puede
// borrar algo que el usuario escribió. Para alguien con 12 días de racha,
// ver un 0 después de abrir la app es motivo suficiente para abandonar.

test('sin nube, lo local queda intacto', () => {
  const local = { rachaActual: 5, diario: { '2026-08-10': 'camine' } };
  assert.deepEqual(fusionar(local, null), local);
});

// --- Hábitos --------------------------------------------------------------
//
// Se subían a la nube y nadie los leía de vuelta. Al cambiar de teléfono, o
// al volver a entrar con la misma cuenta, semanas de hábitos cumplidos
// desaparecían aunque las filas siguieran intactas en la base.

test('los hábitos vuelven de la nube', () => {
  const fusionado = fusionar(
    {},
    { habitos: ['agua'], habitosHechos: { agua: ['2026-08-18', '2026-08-17'] } },
  );

  assert.deepEqual(fusionado.habitos, ['agua']);
  assert.deepEqual(fusionado.habitosHechos.agua, ['2026-08-18', '2026-08-17']);
});

test('lo marcado sin señal no lo borra la nube', () => {
  // La nube trae la lista completa de un hábito. Con una copia superficial
  // reemplazaba la del teléfono, y con ella los días que aún no habían subido.
  const fusionado = fusionar(
    { habitosHechos: { agua: ['2026-08-19'] } },
    { habitosHechos: { agua: ['2026-08-18', '2026-08-17'] } },
  );

  assert.deepEqual(fusionado.habitosHechos.agua, ['2026-08-19', '2026-08-18', '2026-08-17']);
});

test('un hábito que solo está en el teléfono sobrevive', () => {
  const fusionado = fusionar(
    { habitos: ['estirar'], habitosHechos: { estirar: ['2026-08-19'] } },
    { habitos: ['agua'], habitosHechos: { agua: ['2026-08-18'] } },
  );

  assert.deepEqual([...fusionado.habitos].sort(), ['agua', 'estirar']);
  assert.deepEqual(fusionado.habitosHechos.estirar, ['2026-08-19']);
});

test('el elegido sin señal no se cae por el tope de tres', () => {
  // Lo del teléfono va primero justo por esto: es lo último que tocó.
  const juntos = fusionarHabitos(['nuevo'], ['a', 'b', 'c']);
  assert.equal(juntos.length, 3);
  assert.ok(juntos.includes('nuevo'));
});

test('sin hábitos en ningún lado no se inventa nada', () => {
  const fusionado = fusionar({}, {});
  assert.deepEqual(fusionado.habitos, []);
  assert.deepEqual(fusionado.habitosHechos, {});
  assert.deepEqual(fusionarHabitosHechos(), {});
});

test('no se repiten días si el mismo está en los dos lados', () => {
  const juntos = fusionarHabitosHechos({ agua: ['2026-08-18'] }, { agua: ['2026-08-18'] });
  assert.deepEqual(juntos.agua, ['2026-08-18']);
});

// --- Dinero ---------------------------------------------------------------

const g = (id, fecha, monto) => ({ id, fecha, monto, categoria: 'mercado', nota: '' });

test('un gasto anotado sin señal no lo borra la nube', () => {
  const fusionado = fusionar(
    { gastos: [g('g-2', '2026-08-19', 9000)] },
    { gastos: [g('g-1', '2026-08-18', 12000)] },
  );

  assert.equal(fusionado.gastos.length, 2);
  assert.ok(fusionado.gastos.some((x) => x.id === 'g-2'), 'se perdió el que no había subido');
});

test('un gasto que está en los dos lados no se duplica', () => {
  const fusionado = fusionar(
    { gastos: [g('g-1', '2026-08-18', 12000)] },
    { gastos: [g('g-1', '2026-08-18', 12500)] },
  );

  assert.equal(fusionado.gastos.length, 1);
  assert.equal(fusionado.gastos[0].monto, 12500, 'lo confirmado por el servidor manda');
});

test('los gastos quedan del más nuevo al más viejo', () => {
  const fusionado = fusionar(
    { gastos: [g('a', '2026-08-01', 1)] },
    { gastos: [g('b', '2026-08-19', 2), g('c', '2026-08-10', 3)] },
  );

  assert.deepEqual(fusionado.gastos.map((x) => x.id), ['b', 'c', 'a']);
});

test('un presupuesto vacío en la nube no borra el que la persona puso', () => {
  const fusionado = fusionar({ presupuesto: { mensual: 500000, porCategoria: {} } }, { gastos: [] });
  assert.equal(fusionado.presupuesto.mensual, 500000);
});

test('una nube vacía NO baja la racha', () => {
  const local = { rachaActual: 12, mejorRacha: 12, ultimoDiaCompletado: '2026-08-18' };
  const nube = { rachaActual: 0, mejorRacha: 0, ultimoDiaCompletado: null };

  const r = fusionar(local, nube);
  assert.equal(r.rachaActual, 12);
  assert.equal(r.mejorRacha, 12);
  assert.equal(r.ultimoDiaCompletado, '2026-08-18');
});

test('la nube manda cuando va adelante', () => {
  const local = { rachaActual: 2, mejorRacha: 4, ultimoDiaCompletado: '2026-08-15' };
  const nube = { rachaActual: 7, mejorRacha: 9, ultimoDiaCompletado: '2026-08-18' };

  const r = fusionar(local, nube);
  assert.equal(r.rachaActual, 7);
  assert.equal(r.mejorRacha, 9);
  assert.equal(r.ultimoDiaCompletado, '2026-08-18');
});

test('lo marcado sin señal sobrevive a la sincronización', () => {
  // El usuario marcó el 17 y el 18 sin internet; la nube solo sabe del 16.
  const local = { diasCompletados: ['2026-08-18', '2026-08-17', '2026-08-16'] };
  const nube = { diasCompletados: ['2026-08-16'] };

  const r = fusionar(local, nube);
  assert.deepEqual(r.diasCompletados, ['2026-08-18', '2026-08-17', '2026-08-16']);
});

test('los días se unen sin repetirse y quedan del más nuevo al más viejo', () => {
  const r = fusionarDias(['2026-08-16', '2026-08-14'], ['2026-08-16', '2026-08-15']);
  assert.deepEqual(r, ['2026-08-16', '2026-08-15', '2026-08-14']);
});

test('un diario vacío en la nube no borra el del teléfono', () => {
  const local = { '2026-08-17': 'Camine 20 minutos' };
  const nube = {};
  assert.deepEqual(fusionarDiario(local, nube), local);
});

test('una entrada vacía en la nube no pisa una escrita en el teléfono', () => {
  const local = { '2026-08-17': 'Camine 20 minutos' };
  const nube = { '2026-08-17': '' };
  assert.equal(fusionarDiario(local, nube)['2026-08-17'], 'Camine 20 minutos');
});

test('el diario se une por fecha: cada uno aporta lo suyo', () => {
  const local = { '2026-08-17': 'del telefono' };
  const nube = { '2026-08-16': 'de la nube' };

  const r = fusionarDiario(local, nube);
  assert.equal(r['2026-08-17'], 'del telefono');
  assert.equal(r['2026-08-16'], 'de la nube');
});

test('con la misma fecha en ambos lados, gana la nube si tiene contenido', () => {
  const local = { '2026-08-17': 'version vieja' };
  const nube = { '2026-08-17': 'version editada en otro telefono' };
  assert.equal(fusionarDiario(local, nube)['2026-08-17'], 'version editada en otro telefono');
});

test('el perfil de la nube manda sin borrar lo que solo vive en el teléfono', () => {
  const local = { perfil: { nombre: 'Dani', push_token: 'ExponentPushToken[abc]' } };
  const nube = { perfil: { nombre: 'Daniel', objetivo: 'Sentirme mejor' } };

  const r = fusionar(local, nube);
  assert.equal(r.perfil.nombre, 'Daniel');
  assert.equal(r.perfil.objetivo, 'Sentirme mejor');
  assert.equal(r.perfil.push_token, 'ExponentPushToken[abc]', 'el token no tiene columna todavía');
});

test('si la nube aún no tiene plan, se conserva el del disco', () => {
  const local = { plan: { semana: 1, dias: [] } };
  const nube = { plan: null };
  assert.deepEqual(fusionar(local, nube).plan, { semana: 1, dias: [] });
});

test('el plan de la nube reemplaza al del disco cuando existe', () => {
  const local = { plan: { semana: 1 } };
  const nube = { plan: { semana: 2 } };
  assert.deepEqual(fusionar(local, nube).plan, { semana: 2 });
});

test('no revienta con datos incompletos', () => {
  assert.doesNotThrow(() => fusionar(undefined, undefined));
  assert.doesNotThrow(() => fusionar({}, {}));
  assert.doesNotThrow(() => fusionar({ diario: undefined }, { diario: undefined }));
});

test('el caso completo: usuario con racha que abre la app sin señal previa', () => {
  const local = {
    onboardingListo: true,
    perfil: { nombre: 'Daniel', push_token: 'tok' },
    rachaActual: 12,
    mejorRacha: 12,
    ultimoDiaCompletado: '2026-08-18',
    diasCompletados: ['2026-08-18', '2026-08-17'],
    diario: { '2026-08-18': 'sin señal pero lo hice' },
  };

  // La nube quedó atrasada: solo tiene lo de antes del corte.
  const nube = {
    onboardingListo: true,
    perfil: { nombre: 'Daniel', objetivo: 'Sentirme mejor' },
    rachaActual: 10,
    mejorRacha: 12,
    ultimoDiaCompletado: '2026-08-16',
    diasCompletados: ['2026-08-16'],
    diario: {},
    plan: null,
  };

  const r = fusionar(local, nube);

  assert.equal(r.rachaActual, 12, 'la racha no puede bajar por sincronizar');
  assert.equal(r.ultimoDiaCompletado, '2026-08-18');
  assert.deepEqual(r.diasCompletados, ['2026-08-18', '2026-08-17', '2026-08-16']);
  assert.equal(r.diario['2026-08-18'], 'sin señal pero lo hice');
  assert.equal(r.perfil.objetivo, 'Sentirme mejor');
  assert.equal(r.perfil.push_token, 'tok');
});
