function generateActivityCalendarHTML() {
    const totalDays = 15 * 7; // Approx 15 weeks
    let html = '';
    const activityColors = [
        'bg-gray-200',      // No activity
        'bg-sky-200',       // Low
        'bg-sky-400',       // Medium
        'bg-sky-600',       // High
        'bg-sky-800'        // Very High
    ];

    for (let i = 0; i < totalDays; i++) {
        const activityLevel = Math.floor(Math.random() * activityColors.length);
        const color = activityColors[activityLevel];
        html += `<div class="activity-day ${color}" title="Simulated activity"></div>`;
    }
    return html;
}


export function renderDashboard(container) {
    container.innerHTML = `
        <div class="space-y-10">
            <!-- Section: Learning Statistics -->
            <div>
                <h2 class="text-2xl font-bold text-gray-800 mb-4">Statistiques d'Apprentissage</h2>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <!-- Stat Card 1: Total Learning Time -->
                    <div class="bg-white rounded-xl shadow-sm p-6 flex items-center">
                        <div class="p-3 bg-blue-100 rounded-full">
                            <i data-lucide="clock" class="w-7 h-7 text-blue-600"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm text-gray-500">Temps total</p>
                            <p class="text-2xl font-semibold text-gray-800">10 heures</p>
                        </div>
                    </div>
                    <!-- Stat Card 2: Vocabulary Learned -->
                    <div class="bg-white rounded-xl shadow-sm p-6 flex items-center">
                        <div class="p-3 bg-green-100 rounded-full">
                            <i data-lucide="book-copy" class="w-7 h-7 text-green-600"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm text-gray-500">Mots appris</p>
                            <p class="text-2xl font-semibold text-gray-800">150 mots</p>
                        </div>
                    </div>
                    <!-- Stat Card 3: Course Completion -->
                    <div class="bg-white rounded-xl shadow-sm p-6 flex items-center">
                        <div class="p-3 bg-yellow-100 rounded-full">
                           <i data-lucide="pie-chart" class="w-7 h-7 text-yellow-600"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-sm text-gray-500">Cours terminés</p>
                            <p class="text-2xl font-semibold text-gray-800">25%</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Section: Activity Calendar -->
            <div>
                <h2 class="text-2xl font-bold text-gray-800 mb-4">Calendrier d'Activité</h2>
                <div class="bg-white rounded-xl shadow-sm p-6 overflow-x-auto">
                    <div class="activity-grid">
                        ${generateActivityCalendarHTML()}
                    </div>
                </div>
            </div>

            <!-- Section: Achievements / Badges -->
            <div>
                <h2 class="text-2xl font-bold text-gray-800 mb-4">Succès & Badges</h2>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <!-- Badge 1 -->
                    <div class="bg-white rounded-xl shadow-sm p-6 text-center">
                        <div class="w-20 h-20 bg-orange-100 rounded-full mx-auto flex items-center justify-center">
                           <i data-lucide="flame" class="w-10 h-10 text-orange-500"></i>
                        </div>
                        <h3 class="mt-4 font-semibold text-lg text-gray-800">Série de 7 jours</h3>
                        <p class="mt-1 text-sm text-gray-500">Vous avez étudié 7 jours de suite. Bravo !</p>
                    </div>
                    <!-- Badge 2 -->
                    <div class="bg-white rounded-xl shadow-sm p-6 text-center opacity-50">
                        <div class="w-20 h-20 bg-indigo-100 rounded-full mx-auto flex items-center justify-center">
                           <i data-lucide="award" class="w-10 h-10 text-indigo-500"></i>
                        </div>
                        <h3 class="mt-4 font-semibold text-lg text-gray-800">Unité 1 Terminée</h3>
                        <p class="mt-1 text-sm text-gray-500">Terminez tous les exercices de l'unité 1.</p>
                    </div>
                     <!-- Badge 3 -->
                    <div class="bg-white rounded-xl shadow-sm p-6 text-center opacity-50">
                        <div class="w-20 h-20 bg-teal-100 rounded-full mx-auto flex items-center justify-center">
                           <i data-lucide="zap" class="w-10 h-10 text-teal-500"></i>
                        </div>
                        <h3 class="mt-4 font-semibold text-lg text-gray-800">Maître du dialogue</h3>
                        <p class="mt-1 text-sm text-gray-500">Participez à 10 conversations en mode dialogue.</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    lucide.createIcons();
}
