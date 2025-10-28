/* eslint-disable no-console */
import { Select } from '@backstage/core-components';
import { Timeperiod } from '../../api/types';
import { getEndDate, getStartDate } from '../../helpers';
import { Box } from '@material-ui/core';

export const AaTimeSelect = ({
  timeperiod,
  setTimeperiod,
}: {
  timeperiod: Timeperiod;
  setTimeperiod: any;
}) => {
  const timeSelect = [
    {
      date_start: getStartDate(6, 'days'),
      date_end: getEndDate(),
      label: 'Last 7 days',
      value: '7days',
    },
    {
      date_start: getStartDate(13, 'days'),
      date_end: getEndDate(),
      label: 'Last 14 days',
      value: '14days',
    },
    {
      date_start: getStartDate(2, 'months'),
      date_end: getEndDate(),
      label: 'Last 2 months',
      value: '2months',
    },
    {
      date_start: getStartDate(3, 'months'),
      date_end: getEndDate(),
      label: 'Last 3 months',
      value: '3months',
    },
  ];

  function handleTimeperiodChange(value: string) {
    const updatedTimeperiod = timeSelect.find(period => period.value === value);
    if (updatedTimeperiod) {
      setTimeperiod(updatedTimeperiod);
    }
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <Box sx={{ minWidth: '260px', marginRight: '24px' }}>
        <Select
          label="Timeperiod"
          items={timeSelect}
          selected="7days"
          onChange={e => handleTimeperiodChange(e.toString())}
        />
      </Box>
    </Box>
  );
};
