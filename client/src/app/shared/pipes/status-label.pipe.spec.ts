import { StatusLabelPipe } from './status-label.pipe';

describe('StatusLabelPipe', () => {
  const pipe = new StatusLabelPipe();

  it('turns enum values into labels', () => {
    expect(pipe.transform('ON_LEAVE')).toBe('On leave');
    expect(pipe.transform('SCHEDULED')).toBe('Scheduled');
  });

  it('handles empty values', () => {
    expect(pipe.transform(null)).toBe('');
  });
});
