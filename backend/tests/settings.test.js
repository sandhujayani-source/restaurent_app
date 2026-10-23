const assert = require('node:assert/strict');
const { afterEach, test } = require('node:test');

const SettingsRepository = require('../src/repositories/settings.repository');
const SettingsService = require('../src/services/settings.service');

const originalMethods = { ...SettingsRepository };

afterEach(() => {
    Object.assign(SettingsRepository, originalMethods);
});

test('normalizes a valid tax rate before persistence', async () => {
    let savedValue;
    SettingsRepository.upsert = async (key, value) => {
        savedValue = value;
        return { setting_key: key, setting_value: value, updated_at: null };
    };

    const setting = await SettingsService.updateSetting('tax_rate', 5.5);

    assert.equal(savedValue, '5.50');
    assert.equal(setting.value, 5.5);
});

test('normalizes configured payment methods and requires cash', async () => {
    let savedValue;
    SettingsRepository.upsert = async (key, value) => {
        savedValue = value;
        return { setting_key: key, setting_value: value, updated_at: null };
    };

    await SettingsService.updateSetting('payment_methods', ['Cash', 'Card', 'cash']);

    assert.deepEqual(JSON.parse(savedValue), ['cash', 'card']);
    await assert.rejects(
        SettingsService.updateSetting('payment_methods', ['card']),
        error => error.statusCode === 400
    );
});

test('rejects unknown settings and refuses billing without configuration', async () => {
    SettingsRepository.findByKey = async () => null;

    await assert.rejects(
        SettingsService.updateSetting('unknown', 'value'),
        error => error.statusCode === 404
    );
    await assert.rejects(
        SettingsService.getBillingConfiguration(),
        error => error.statusCode === 503
    );
});