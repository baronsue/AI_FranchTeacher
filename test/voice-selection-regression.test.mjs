import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

function extractFunction(source, declaration) {
    const start = source.indexOf(declaration);
    assert.notEqual(start, -1, `${declaration} must exist`);

    const braceStart = source.indexOf('{', start);
    let depth = 0;

    for (let index = braceStart; index < source.length; index += 1) {
        if (source[index] === '{') depth += 1;
        if (source[index] === '}') depth -= 1;
        if (depth === 0) return source.slice(start, index + 1);
    }

    throw new Error(`Could not extract ${declaration}`);
}

function createSelect() {
    const select = {
        options: [{ value: '', textContent: '自动选择（推荐）' }],
        selectedValue: '',
        remove(index) {
            const [removed] = this.options.splice(index, 1);
            if (removed?.value === this.selectedValue) {
                this.selectedValue = this.options[0]?.value || '';
            }
        },
        appendChild(option) {
            this.options.push(option);
        },
        get value() {
            return this.selectedValue;
        },
        set value(nextValue) {
            this.selectedValue = this.options.some(option => option.value === nextValue)
                ? nextValue
                : '';
        },
    };

    return select;
}

test('异步刷新语音列表后保留用户选择的法语音色', async () => {
    const source = await readFile(
        new URL('../views/dialogue_view.js', import.meta.url),
        'utf8'
    );
    const functionSource = extractFunction(source, 'function populateVoiceSelector()');
    const selector = createSelect();
    const frenchVoices = [
        { name: 'Amélie', lang: 'fr-FR', voiceURI: 'amelie', localService: true },
        { name: 'Thomas', lang: 'fr-FR', voiceURI: 'thomas', localService: true },
    ];
    const context = {
        document: {
            getElementById(id) {
                if (id === 'voice-selector') return selector;
                return null;
            },
            createElement() {
                return { value: '', textContent: '' };
            },
        },
        getAvailableFrenchVoices: () => frenchVoices,
        voiceSelectValue: voice => voice.voiceURI,
        navigator: { userAgent: '', platform: '', maxTouchPoints: 0 },
        selectedVoiceURI: null,
        console: { log() {}, warn() {}, error() {} },
    };
    const populateVoiceSelector = vm.runInNewContext(`(${functionSource})`, context);

    populateVoiceSelector();
    selector.value = 'thomas';
    assert.equal(selector.value, 'thomas', 'test setup must select a concrete voice');

    populateVoiceSelector();

    assert.equal(selector.value, 'thomas');
});
