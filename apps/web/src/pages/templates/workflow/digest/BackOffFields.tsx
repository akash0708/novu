import { Group } from '@mantine/core';
import { Controller, useFormContext } from 'react-hook-form';
import { Collapse } from '@mantine/core';
import { DigestTypeEnum } from '@novu/shared';

import { colors, Input, Switch, Tooltip } from '../../../../design-system';
import { inputStyles } from '../../../../design-system/config/inputs.styles';
import { IntervalSelect } from './IntervalSelect';
import { BackOffTooltipIcon } from './icons/BackOffTooltipIcon';
import { When } from '../../../../components/utils/When';

export const BackOffFields = ({ index, control, readonly }) => {
  const {
    formState: { errors, isSubmitted },
    watch,
  } = useFormContext();

  const backoff = watch(`steps.${index}.digestMetadata.${DigestTypeEnum.REGULAR}.backoff`);
  const showErrors = isSubmitted && errors?.steps;

  return (
    <>
      <Tooltip
        width={312}
        multiline
        position="left"
        label={
          <>
            <div>
              When the 2nd event occurs after the previous digest was sent, system starts to aggregate any further
              events.
            </div>
            <BackOffTooltipIcon />
          </>
        }
      >
        <Group spacing={0} mt={20} sx={{ color: colors.B60 }}>
          <Controller
            name={`steps.${index}.digestMetadata.${DigestTypeEnum.REGULAR}.backoff`}
            defaultValue={false}
            control={control}
            render={({ field }) => {
              return <Switch data-test-id="backoff-switch" checked={field.value === true} onChange={field.onChange} />;
            }}
          />
          <div>Only frequent events</div>
        </Group>
      </Tooltip>
      <Collapse in={backoff}>
        <When truthy={backoff}>
          <div style={{ color: colors.B60, marginBottom: 16, marginTop: 16 }}>Start digest only after occurred:</div>
          <Group spacing={8} sx={{ color: colors.B60 }}>
            <span>more than 1 event for the last</span>
            <Controller
              control={control}
              name={`steps.${index}.digestMetadata.${DigestTypeEnum.REGULAR}.backoffAmount`}
              defaultValue=""
              render={({ field, fieldState }) => {
                return (
                  <Input
                    {...field}
                    value={field.value || ''}
                    error={showErrors && fieldState.error?.message}
                    min={0}
                    max={100}
                    type="number"
                    data-test-id="backoff-amount"
                    placeholder="0"
                    required
                    disabled={readonly}
                    styles={(theme) => ({
                      ...inputStyles(theme),
                      input: {
                        textAlign: 'center',
                        ...inputStyles(theme).input,
                        minHeight: '30px',
                        margin: 0,
                        height: 30,
                        lineHeight: '32px',
                      },
                    })}
                  />
                );
              }}
            />
            <div
              style={{
                width: '90px',
                height: 30,
              }}
            >
              <IntervalSelect
                readonly={readonly}
                control={control}
                name={`steps.${index}.digestMetadata.${DigestTypeEnum.REGULAR}.backoffUnit`}
                showErrors={showErrors}
                testId="time-unit-backoff"
              />
            </div>
          </Group>
        </When>
      </Collapse>
    </>
  );
};
