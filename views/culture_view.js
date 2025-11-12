import { cultureData } from '../data/culture_data.js';

function createCultureCard(item) {
    const card = document.createElement('div');
    card.className = 'culture-card bg-white rounded-xl shadow-lg overflow-hidden flex flex-col hover:shadow-2xl transition-all duration-300 ease-in-out';

    card.innerHTML = `
        <div class="h-56 overflow-hidden">
            <img src="${item.imageUrl}" alt="${item.title}" class="w-full h-full object-cover transform hover:scale-110 transition-transform duration-500">
        </div>
        <div class="p-6 flex-grow flex flex-col">
            <h3 class="text-xl font-bold text-gray-800 mb-3">${item.title}</h3>
            <p class="text-gray-600 text-sm flex-grow">${item.description}</p>
        </div>
    `;
    return card;
}

export function renderCultureView(container) {
    container.innerHTML = `
        <div class="fade-in">
            <header class="mb-8">
                <h1 class="text-4xl font-bold text-gray-800">Explorer la Culture Française</h1>
                <p class="text-lg text-gray-500 mt-2">Découvrez la richesse et la diversité de la culture française à travers ces thèmes fascinants.</p>
            </header>
            <div id="culture-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            </div>
        </div>
    `;

    const grid = container.querySelector('#culture-grid');
    cultureData.forEach(item => {
        grid.appendChild(createCultureCard(item));
    });
}
