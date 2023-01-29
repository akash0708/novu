import { useClipboard } from '@mantine/hooks';
import styled from '@emotion/styled';
import { inputStyles } from '../../../design-system/config/inputs.styles';
import Card from '../../../components/layout/components/Card';
import { ActionIcon, Center, Input as MantineInput } from '@mantine/core';
import { colors, Text, Input, Tooltip, Button } from '../../../design-system';
import { Check, CheckCircle, Copy } from '../../../design-system/icons';
import React, { useEffect } from 'react';
import { Control, Controller, useForm } from 'react-hook-form';
import { useEnvController } from '../../../store/use-env-controller';
import { useMutation } from '@tanstack/react-query';
import { updateDnsSettings } from '../../../api/environment';
import { showNotification } from '@mantine/notifications';
import { WarningIcon } from '../../../design-system/icons/general/WarningIcon';
import { validateMxRecord } from '../../../api/inbound-parse';

export const EmailSettings = () => {
  const MAIL_SERVER_DOMAIN = `10 ${process.env.REACT_APP_MAIL_SERVER_DOMAIN ?? 'dev.inbound-mail.novu.co'}`;

  const clipboardEnvironmentIdentifier = useClipboard({ timeout: 1000 });
  const { readonly, environment, refetchEnvironment } = useEnvController();

  const { mutateAsync: updateDnsSettingsMutation, isLoading: isUpdateDnsSettingsLoading } = useMutation<
    { dns: { mxRecordConfigured: boolean; inboundParseDomain: string } },
    { error: string; message: string; statusCode: number },
    { payload: { inboundParseDomain: string | undefined }; environmentId: string }
  >(({ payload, environmentId }) => updateDnsSettings(payload, environmentId));

  const { setValue, handleSubmit, control } = useForm({
    defaultValues: {
      mxRecordConfigured: false,
      inboundParseDomain: '',
    },
  });

  useEffect(() => {
    if (environment) {
      if (environment.dns?.inboundParseDomain) {
        setValue('inboundParseDomain', environment.dns?.inboundParseDomain);
      }
      if (environment.dns?.mxRecordConfigured) {
        setValue('mxRecordConfigured', environment.dns?.mxRecordConfigured);
      }
    }
  }, [environment]);

  useEffect(() => {
    handleCheckRecords();
  }, []);

  async function handleUpdateDnsSettings({ inboundParseDomain }) {
    const payload = {
      inboundParseDomain,
    };

    await updateDnsSettings(payload, environment?._id ?? '');

    showNotification({
      message: 'Domain info updated successfully',
      color: 'green',
    });
  }

  async function handleCheckRecords() {
    const record = await validateMxRecord();

    if (record.mxRecordConfigured !== environment?.dns?.mxRecordConfigured) {
      await refetchEnvironment();
    }
  }

  return (
    <Container>
      <Card title="Configure Inbound Webhook">
        <StyledButton variant={'outline'} onClick={handleCheckRecords}>
          Check my record
        </StyledButton>
        <form noValidate onSubmit={handleSubmit(handleUpdateDnsSettings)}>
          <MantineInput.Wrapper
            label={<Label control={control} />}
            description={<DescriptionText />}
            styles={inputStyles}
          >
            <Input
              readOnly
              rightSection={
                <Tooltip label={clipboardEnvironmentIdentifier.copied ? 'Copied!' : 'Copy Key'}>
                  <ActionIcon
                    variant="transparent"
                    data-test-id={'mail-server-domiain-copy'}
                    onClick={() => clipboardEnvironmentIdentifier.copy(MAIL_SERVER_DOMAIN)}
                  >
                    {clipboardEnvironmentIdentifier.copied ? <Check /> : <Copy />}
                  </ActionIcon>
                </Tooltip>
              }
              value={MAIL_SERVER_DOMAIN}
              data-test-id="mail-server-identifier"
            />
          </MantineInput.Wrapper>
          <Controller
            control={control}
            name="inboundParseDomain"
            render={({ field }) => (
              <Input
                {...field}
                mb={30}
                data-test-id="inbound-parse-domain"
                disabled={readonly}
                value={field.value || ''}
                label={'Whitelisted Domain'}
                description={
                  'To ensure proper delivery of correspondence, we request that you provide us with your domain so ' +
                  'that it can be added to our whitelist'
                }
                placeholder="Domain goes here..."
              />
            )}
          />
          <Button submit mb={20} mt={10} data-test-id="submit-hmac-settings">
            Update
          </Button>
        </form>
      </Card>
    </Container>
  );
};

function DescriptionText() {
  return (
    <Text>
      To configure email routing for your domain, set up an MX record with your domain host with a priority of 10 to
      direct mail to Novu`s inbound mail server. This ensures that subscriber's email will be properly directed to the
      correct server.
    </Text>
  );
}

function Label({ control }: { control: Control<{ mxRecordConfigured: boolean; inboundParseDomain: string }, any> }) {
  return (
    <div style={{ display: 'flex' }}>
      <div>MX Record</div>
      <Controller
        control={control}
        name="mxRecordConfigured"
        render={({ field }) => {
          return (
            <Center ml={5}>
              {field.value ? <CheckCircle color={colors.success} /> : <WarningIcon />}

              <Text ml={7} color={field.value ? colors.success : colors.warning}>
                {field.value ? 'Configured' : 'Not Configured'}
              </Text>
            </Center>
          );
        }}
      />
    </div>
  );
}

const Container = styled.div`
  max-width: 600px;
  padding-bottom: 32px;
`;

const StyledButton = styled(Button)`
  background-image: ${({ theme }) =>
    theme.colorScheme === 'dark'
      ? `linear-gradient(0deg, ${colors.B17} 0%, ${colors.B17} 100%),linear-gradient(99deg,#DD2476 0% 0%, #FF512F 100% 100%)`
      : `linear-gradient(0deg, ${colors.B98} 0%, ${colors.B98} 100%),linear-gradient(99deg,#DD2476 0% 0%, #FF512F 100% 100%)`};
  margin-bottom: 10px;
`;
