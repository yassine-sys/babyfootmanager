const ws = new WebSocket('ws://localhost:3000');

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  switch (message.type) {
    case 'CREATE':
      ajouterPartie(message.partie);
      break;
    case 'DELETE':
      supprimerPartie(message.id);
      break;
    case 'UPDATE':
      terminerPartie(message.partie);
      break;
  }
  mettreAJourCompteur();
};

async function creerPartie() {
  const nom = document.getElementById('nom').value;
  if (!nom) {
    alert('Veuillez entrer un nom pour la partie');
    return;
  }

  const response = await fetch('/parties', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nom })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error(`Erreur lors de la création de la partie : ${error.error}`);
    alert(`Erreur lors de la création de la partie : ${error.error}`);
    return;
  }

  const partie = await response.json();
  ajouterPartie(partie);
}

async function supprimerPartie(id) {
    await fetch(`/parties/${id}`, { method: 'DELETE' });
    const element = document.getElementById(`partie-${id}`);
    if (element) {
      element.remove();
    }
  }
  
  async function terminerPartie(partie) {
    const response = await fetch(`/parties/${partie.id}/terminee`, { method: 'PUT' });
    const updatedPartie = await response.json();
    const element = document.getElementById(`partie-${updatedPartie.id}`);
    if (element) {
      element.classList.add('terminee');
      const actions = element.querySelector('.actions');
      if (actions) {
        actions.remove();
      }
    }
  }

function ajouterPartie(partie) {
    // Supprime l'élément existant s'il existe
    const existingElement = document.getElementById(`partie-${partie.id}`);
    if (existingElement) {
        existingElement.remove();
    }

    const li = document.createElement('li');
  li.id = `partie-${partie.id}`;
  li.className = partie.terminee ? 'terminee' : '';
  li.innerHTML = `
    <span>${partie.nom} - ${new Date(partie.date_creation).toLocaleString()}</span>
    ${!partie.terminee ? `
      <span class="actions">
      <i class="fa-duotone fa-square-check"> <button onclick="terminerPartie(${partie.id})">Terminer</button></i>
       
        <button onclick="supprimerPartie(${partie.id})">Supprimer</button>
      </span>
    ` : ''}
  `;
    document.getElementById('parties').appendChild(li);
}

async function mettreAJourCompteur() {
  const response = await fetch('/compteur');
  const compteur = await response.json();
  document.getElementById('compteur').innerText = `Parties non terminées : ${compteur.count}`;
}

(async function init() {
  const response = await fetch('/parties');
  const parties = await response.json();
  parties.forEach(ajouterPartie);
  mettreAJourCompteur();
})();
