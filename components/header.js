function navigate(view) {
    window.dispatchEvent(new CustomEvent('navigate', { detail: { view } }));
}

export function createHeader() {
    const header = document.createElement('header');
    header.className = 'bg-white shadow-md sticky top-0 z-50';
    
    header.innerHTML = `
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-20">
                <div class="flex items-center cursor-pointer" id="home-link">
                    <img class="h-10 w-auto" src="https://r2.flowith.net/files/png/QE1EX-french_language_learning_app_logo_index_2@1024x1024.png" alt="App Logo">
                    <span class="ml-3 text-2xl font-bold text-[#333]">Aurélie</span>
                </div>

                <nav class="hidden md:flex items-center space-x-8">
                    <a href="#" id="nav-dashboard" class="text-gray-600 hover:text-blue-600 font-medium transition-colors">Tableau de Bord</a>
                    <a href="#" id="nav-course" class="text-gray-600 hover:text-blue-600 font-medium transition-colors">Mode Cours</a>
                    <a href="#" id="nav-dialogue" class="text-gray-600 hover:text-blue-600 font-medium transition-colors">Mode Dialogue</a>
                    <a href="#" id="nav-culture" class="text-gray-600 hover:text-blue-600 font-medium transition-colors">Explorer la Culture</a>
                </nav>

                <div class="flex items-center">
                    <span class="text-sm font-medium text-gray-600 mr-3 hidden sm:block">Votre tutrice IA</span>
                    <img class="h-12 w-12 rounded-full" src="https://r2.flowith.net/files/png/Y6F4R-ai_french_teacher_avatar_index_1@1024x1024.png" alt="Aurélie, AI Teacher">
                </div>
            </div>
        </div>
    `;

    const handleNavClick = (e, view) => {
        e.preventDefault();
        navigate(view);
    };

    header.querySelector('#home-link').addEventListener('click', () => navigate('dashboard'));
    header.querySelector('#nav-dashboard').addEventListener('click', (e) => handleNavClick(e, 'dashboard'));
    header.querySelector('#nav-course').addEventListener('click', (e) => handleNavClick(e, 'course'));
    header.querySelector('#nav-dialogue').addEventListener('click', (e) => handleNavClick(e, 'dialogue'));
    header.querySelector('#nav-culture').addEventListener('click', (e) => handleNavClick(e, 'culture'));

    return header;
}
