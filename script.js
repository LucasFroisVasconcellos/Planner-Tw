function segundosParaTempo(segundos) {
  console.log("segundosParaTempo called");
  const h = Math.floor(segundos / 3600);
  const m = Math.floor((segundos % 3600) / 60);
  const s = Math.floor(segundos % 60);
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
}

function openTab(evt, tabName) {
  console.log(`openTab called with tabName: ${tabName}`);
  var i, tabcontent, tablinks;
  tabcontent = document.getElementsByClassName("tab-content");
  for (i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }
  tablinks = document.getElementsByClassName("tab-button");
  for (i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
  }
  document.getElementById(tabName).style.display = "block";
  evt.currentTarget.className += " active";
}

function gerarTabela() {
  console.log("gerarTabela called");
  const tempoCampo = document.getElementById('tempoCampo').value;
  const saidaCompleta = new Date(document.getElementById('saidaCompleta').value);
  const origem = document.getElementById('origem').value.split('|').map(Number);
  const destinos = document.getElementById('destinos').value.trim().split(/\s+/);

  const [min, seg] = tempoCampo.split(':').map(Number);
  const segundosPorCampo = min * 60 + seg;

  const resultados = destinos.map(dest => {
    const [x2, y2] = dest.split('|').map(Number);
    const distancia = Math.sqrt(Math.pow(x2 - origem[0], 2) + Math.pow(y2 - origem[1], 2));
    const tempoAteLa = distancia * segundosPorCampo;

    return {
      destino: dest,
      distancia: distancia,
      tempoSegundos: tempoAteLa
    };
  });

  resultados.sort((a, b) => a.distancia - b.distancia);

  const tbody = document.querySelector('#tabela tbody');
  tbody.innerHTML = "";

  let proximaSaida = new Date(saidaCompleta);

  resultados.forEach((item, i) => {
    const tempoMs = item.tempoSegundos * 1000;

    const chegada = new Date(proximaSaida.getTime() + tempoMs);
    const retorno = new Date(chegada.getTime() + tempoMs);
    const proxima = new Date(retorno.getTime() + 5 * 60 * 1000); // 5 minutos depois do retorno

    const row = `
      <tr>
        <td>${item.destino}</td>
        <td>${item.distancia.toFixed(2)}</td>
        <td>${segundosParaTempo(item.tempoSegundos)}</td>
        <td>${formatarHorario(proximaSaida)}</td>
        <td>${formatarHorario(chegada)}</td>
        <td>${formatarHorario(retorno)}</td>
        <td>${i === resultados.length - 1 ? '—' : formatarHorario(proxima)}</td>
      </tr>
    `;

    tbody.insertAdjacentHTML('beforeend', row);
    proximaSaida = proxima;
  });

  renderListaOrdenada(resultados);
}

function renderListaOrdenada(lista) {
  const ordenada = [...lista].sort((a, b) => a.distancia - b.distancia);
  const coords = ordenada.map(d => d.destino).join(" ");
  document.getElementById("listaOrdenada").innerHTML = `
    <strong>Coordenadas ordenadas por distância:</strong><br>
    <code>${coords}</code>
  `;
}

function formatarHorario(data) {
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();
  const h = String(data.getHours()).padStart(2, '0');
  const m = String(data.getMinutes()).padStart(2, '0');
  const s = String(data.getSeconds()).padStart(2, '0');
  return `${dia}/${mes}/${ano} ${h}:${m}:${s}`;
}

function ordenarPor(campo) {
  const tbody = document.querySelector('#tabela tbody');
  const linhas = Array.from(tbody.querySelectorAll('tr'));

  const idx = {
    'destino': 0,
    'distancia': 1
  }[campo];

  const ordenado = linhas.sort((a, b) => {
    const valA = a.children[idx].innerText;
    const valB = b.children[idx].innerText;
    return campo === 'distancia'
      ? parseFloat(valA) - parseFloat(valB)
      : valA.localeCompare(valB);
  });

  tbody.innerHTML = "";
  ordenado.forEach(linha => tbody.appendChild(linha));
}

function distributeTargets() {
  console.log("distributeTargets called");
  const playerData = document.getElementById('playerData').value.trim();
  const enemyCoords = document.getElementById('enemyCoords').value.trim();
  const resultDiv = document.getElementById('opResult');

  if (!playerData || !enemyCoords) {
    resultDiv.textContent = 'Por favor, preencha todos os campos.';
    return;
  }

  const opTempoUnidade = document.getElementById('opTempoUnidade').value;
  if (!opTempoUnidade) {
    resultDiv.textContent = 'Por favor, preencha o tempo da unidade.';
    return;
  }
  const [min, seg] = opTempoUnidade.split(':').map(Number);
  const segundosPorCampo = min * 60 + seg;

  if (isNaN(segundosPorCampo) || segundosPorCampo <= 0) {
    resultDiv.textContent = 'Formato de tempo da unidade inválido. Use MM:SS (ex: 09:20).';
    return;
  }

  const players = playerData.split('\n').map(line => {
    const parts = line.trim().split(/\s+/);
    const name = parts[0];
    const targetCount = parseInt(parts[parts.length - 1], 10);
    const coords = parts.slice(1, parts.length - 1);
    return { name, coords, targetCount };
  });

  const targets = enemyCoords.split(/\s+/).map(coords => {
    const [x, y] = coords.split('|').map(Number);
    return { coords, x, y };
  });

  let allPairs = [];
  players.forEach(player => {
    player.coords.forEach(playerCoord => {
      const [playerX, playerY] = playerCoord.split('|').map(Number);
      targets.forEach(target => {
        const distance = Math.sqrt(Math.pow(target.x - playerX, 2) + Math.pow(target.y - playerY, 2));
        const travelTime = distance * segundosPorCampo;
        allPairs.push({ player, target, distance, playerCoord, travelTime });
      });
    });
  });

  allPairs.sort((a, b) => a.distance - b.distance);

  const assignments = {};
  const assignedTargets = new Set();
  players.forEach(player => {
    assignments[player.name] = [];
  });

  allPairs.forEach(pair => {
    const { player, target, distance, playerCoord, travelTime } = pair;
    if (assignments[player.name].length < player.targetCount && !assignedTargets.has(target.coords)) {
      assignments[player.name].push({ target: target.coords, distance, from: playerCoord, travelTime });
      assignedTargets.add(target.coords);
    }
  });

  let resultHTML = '<table><thead><tr><th>Jogador</th><th>Alvo</th><th>Distância</th><th>Origem</th><th>Duração</th></tr></thead><tbody>';
  for (const playerName in assignments) {
    assignments[playerName].forEach(assignment => {
      resultHTML += `<tr><td>${playerName}</td><td>${assignment.target}</td><td>${assignment.distance.toFixed(2)}</td><td>${assignment.from}</td><td>${segundosParaTempo(assignment.travelTime)}</td></tr>`;
    });
  }
  resultHTML += '</tbody></table>';
  resultDiv.innerHTML = resultHTML;
}

function distributeFakes() {
  console.log("distributeFakes called");
  const playerData = document.getElementById('playerDataFake').value.trim();
  const enemyCoords = document.getElementById('enemyCoordsFake').value.trim();
  const resultDiv = document.getElementById('fakeResult'); // Use fakeResult for output

  if (!playerData || !enemyCoords) {
    resultDiv.textContent = 'Por favor, preencha todos os campos.';
    return;
  }

  const fakeTempoUnidade = document.getElementById('fakeTempoUnidade').value; // Use fakeTempoUnidade
  if (!fakeTempoUnidade) {
    resultDiv.textContent = 'Por favor, preencha o tempo da unidade.';
    return;
  }
  const [min, seg] = fakeTempoUnidade.split(':').map(Number);
  const segundosPorCampo = min * 60 + seg;

  if (isNaN(segundosPorCampo) || segundosPorCampo <= 0) {
    resultDiv.textContent = 'Formato de tempo da unidade inválido. Use MM:SS (ex: 09:20).';
    return;
  }

  const players = playerData.split('\n').map(line => {
    const parts = line.trim().split(/\s+/);
    const name = parts[0];
    const targetCount = parseInt(parts[parts.length - 1], 10);
    const coords = parts.slice(1, parts.length - 1);
    return { name, coords, targetCount };
  });

  const targets = enemyCoords.split(/\s+/).map(coords => {
    const [x, y] = coords.split('|').map(Number);
    return { coords, x, y };
  });

  let allPairs = [];
  players.forEach(player => {
    player.coords.forEach(playerCoord => {
      const [playerX, playerY] = playerCoord.split('|').map(Number);
      targets.forEach(target => {
        const distance = Math.sqrt(Math.pow(target.x - playerX, 2) + Math.pow(target.y - playerY, 2));
        const travelTime = distance * segundosPorCampo;
        allPairs.push({ player, target, distance, playerCoord, travelTime });
      });
    });
  });

  // Sort by distance in DESCENDING order for fakes
  allPairs.sort((a, b) => b.distance - a.distance);

  const assignments = {};
  const assignedTargets = new Set();
  players.forEach(player => {
    assignments[player.name] = [];
  });

  const MAX_FAKE_DISTANCE = 69; // Define a distância máxima para fakes

  allPairs.forEach(pair => {
    const { player, target, distance, playerCoord, travelTime } = pair;
    // Check for max distance and if target is already assigned
    if (distance <= MAX_FAKE_DISTANCE && assignments[player.name].length < player.targetCount && !assignedTargets.has(target.coords)) {
      assignments[player.name].push({ target: target.coords, distance, from: playerCoord, travelTime });
      assignedTargets.add(target.coords);
    }
  });

  let resultHTML = '<table><thead><tr><th>Jogador</th><th>Alvo</th><th>Distância</th><th>Origem</th><th>Duração</th></tr></thead><tbody>';
  for (const playerName in assignments) {
    assignments[playerName].forEach(assignment => {
      resultHTML += `<tr><td>${playerName}</td><td>${assignment.target}</td><td>${assignment.distance.toFixed(2)}</td><td>${assignment.from}</td><td>${segundosParaTempo(assignment.travelTime)}</td></tr>`;
    });
  }
  resultHTML += '</tbody></table>';
  resultDiv.innerHTML = resultHTML;
}
