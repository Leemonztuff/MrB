import { logger } from '../logger';

describe('Logger', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should log info messages', () => {
    logger.info('Test message', { key: 'value' });
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should log error messages with error context', () => {
    const error = new Error('Test error');
    logger.error('Error occurred', error, { context: 'test' });
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should log warning messages', () => {
    logger.warn('Warning message');
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should log debug messages', () => {
    logger.debug('Debug message', { debug: true });
    expect(consoleSpy).toHaveBeenCalled();
  });
});
