import { cultureData } from '../data/culture_data.js';

function createCultureCard(item) {
    const card = document.createElement('div');
    card.className =
        'culture-card bg-white rounded-xl shadow-lg overflow-hidden flex flex-col hover:shadow-2xl transition-all duration-300 ease-in-out min-w-0';

    card.innerHTML = `
        <div class="h-44 sm:h-52 md:h-56 overflow-hidden shrink-0">
            <img src="${item.imageUrl}" alt="${item.title}" class="w-full h-full object-cover transform hover:scale-110 transition-transform duration-500">
        </div>
        <div class="p-4 sm:p-6 flex-grow flex flex-col min-w-0">
            <h3 class="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-3 break-words">${item.title}</h3>
            <p class="text-gray-600 text-sm flex-grow break-words">${item.description}</p>
        </div>
    `;
    return card;
}

export function renderCultureView(container) {
    container.innerHTML = `
        <div class="fade-in min-w-0 max-w-full">
            <header class="mb-6 sm:mb-8 min-w-0">
                <h1 class="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 break-words">探索法国文化</h1>
                <p class="text-sm sm:text-base md:text-lg text-gray-500 mt-2 break-words">通过这些精彩主题，发现法国文化的丰富性和多样性。</p>
            </header>
            <div id="culture-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 min-w-0">
            </div>
        </div>
    `;

    const grid = container.querySelector('#culture-grid');
    cultureData.forEach(item => {
        grid.appendChild(createCultureCard(item));
    });
}
