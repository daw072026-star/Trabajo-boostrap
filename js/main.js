(() => {
  const $ = id => document.getElementById(id);

  const menu = $('menuPrincipal');
  menu.querySelectorAll('.nav-link').forEach(enlace => enlace.addEventListener('click', () => {
    if (menu.classList.contains('show')) bootstrap.Collapse.getOrCreateInstance(menu).hide();
  }));

  const filtros = $('formFiltros');
  if (filtros) {
    const filtrar = () => {
      const [min, max] = $('huespedes').value.split('-').map(Number);
      const tipo = $('tipo').value;
      const precio = $('precio').value;
      let visibles = 0;

      document.querySelectorAll('[data-habitacion]').forEach(hab => {
        const d = hab.dataset;
        hab.hidden = !((tipo === 'todas' || tipo === d.habitacion)
          && +d.min <= max && +d.max >= min
          && (precio === 'cualquiera' || +d.precio <= +precio));
        if (!hab.hidden) visibles++;
      });
      $('sinResultados').hidden = visibles > 0;
    };

    filtros.addEventListener('submit', e => { e.preventDefault(); filtrar(); });
    filtros.addEventListener('change', filtrar);
    filtrar();
  }

  const form = $('formReserva');
  if (form) {
    const HAB = { individual: ['Habitación Individual', 69], estandar: ['Doble Estándar', 89], superior: ['Doble Superior', 119] };
    const entrada = $('entrada');
    const salida = $('salida');
    const error = $('errorFechas');

    const iso = fecha => fecha.toLocaleDateString('sv-SE');
    const sumar = (fecha, dias) => { const f = new Date(fecha + 'T00:00'); f.setDate(f.getDate() + dias); return iso(f); };
    const largo = fecha => new Date(fecha + 'T00:00').toLocaleDateString('es-ES', { dateStyle: 'long' });
    const euros = n => n.toLocaleString('es-ES') + ' €';
    const noches = () => Math.round((new Date(salida.value) - new Date(entrada.value)) / 864e5) || 0;
    const habitacion = () => form.querySelector('[name=tipoHabitacion]:checked')?.value;
    const total = () => noches() * HAB[habitacion()][1] * $('habitaciones').value;

    const ajustarSalida = () => {
      if (!entrada.value) return;
      if (!salida.value || salida.value <= entrada.value) salida.value = sumar(entrada.value, 1);
      salida.min = sumar(entrada.value, 1);
    };

    const fechasValidas = () => {
      error.textContent = !entrada.value || !salida.value ? 'Indica la fecha de entrada y la de salida.'
        : entrada.value < entrada.min ? 'La fecha de entrada no puede ser anterior a hoy.'
        : noches() < 1 ? 'La salida debe ser posterior a la entrada.' : '';
      error.hidden = !error.textContent;
      return error.hidden;
    };

    const actualizar = () => {
      const n = noches();
      $('noches').textContent = n > 0 ? `${n} ${n === 1 ? 'noche' : 'noches'}` : 'Revisa las fechas';
      $('resumen').textContent = !habitacion() ? 'Elige una habitación para ver el total estimado.'
        : n < 1 ? 'Revisa las fechas para ver el total.'
        : `Total estimado: ${euros(total())}`;
    };

    const iniciar = () => {
      const hoy = iso(new Date());
      entrada.min = hoy;
      if (!entrada.value || entrada.value < hoy) {
        entrada.value = sumar(hoy, 7);
        salida.value = sumar(hoy, 9);
      }
      ajustarSalida();
      error.hidden = true;
      actualizar();
    };

    form.querySelectorAll('.contador').forEach(contador => {
      const campo = contador.querySelector('input');
      contador.addEventListener('click', e => {
        const boton = e.target.closest('button');
        if (boton) campo.value = Math.min(contador.dataset.max, Math.max(contador.dataset.min, +campo.value + +boton.dataset.cambio));
      });
    });

    form.addEventListener('change', e => {
      if (e.target === entrada) ajustarSalida();
      if (e.target === entrada || e.target === salida) fechasValidas();
      actualizar();
    });

    $('btnDisponibilidad').addEventListener('click', () => {
      if (fechasValidas()) $('habitacion').scrollIntoView({ behavior: 'smooth' });
    });

    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!fechasValidas()) return entrada.scrollIntoView({ behavior: 'smooth', block: 'center' });

      const datos = new FormData(form);
      const adultos = +datos.get('adultos');
      const ninos = +datos.get('ninos');

      $('textoConfirmacion').textContent = `Gracias, ${datos.get('nombre')}. Te escribiremos a ${datos.get('email')} para confirmar tu estancia.`;
      $('listaConfirmacion').innerHTML = [
        ['Entrada', largo(entrada.value)],
        ['Salida', largo(salida.value)],
        ['Noches', noches()],
        ['Habitación', `${datos.get('habitaciones')} × ${HAB[habitacion()][0]}`],
        ['Huéspedes', `${adultos} ${adultos === 1 ? 'adulto' : 'adultos'}` + (ninos ? ` y ${ninos} ${ninos === 1 ? 'niño' : 'niños'}` : '')],
        ['Total estimado', euros(total())]
      ].map(([clave, valor]) => `<li><span>${clave}</span><span>${valor}</span></li>`).join('');

      form.hidden = true;
      $('confirmacion').hidden = false;
      $('tarjetaConfirmacion').scrollIntoView({ behavior: 'smooth' });
      $('tarjetaConfirmacion').focus({ preventScroll: true });
    });

    $('btnNuevaReserva').addEventListener('click', () => {
      form.reset();
      iniciar();
      $('confirmacion').hidden = true;
      form.hidden = false;
      scrollTo({ top: 0, behavior: 'smooth' });
    });

    const elegida = new URLSearchParams(location.search).get('habitacion');
    form.querySelectorAll('[name=tipoHabitacion]').forEach(radio => { radio.checked = radio.checked || radio.value === elegida; });
    iniciar();
  }
})();
