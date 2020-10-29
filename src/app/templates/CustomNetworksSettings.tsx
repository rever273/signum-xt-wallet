import classNames from "clsx";
import React, { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import {
  ThanosNetwork,
  useNetwork,
  useSettings,
  useTezos,
  useThanosClient,
  validateContractAddress,
} from "lib/thanos/front";
import { COLORS } from "lib/ui/colors";
import { T, t } from "lib/i18n/react";
import { viewLambda } from "lib/michelson";
import { NETWORKS } from "lib/thanos/networks";
import { ReactComponent as CloseIcon } from "app/icons/close.svg";
import FormField from "app/atoms/FormField";
import FormSubmitButton from "app/atoms/FormSubmitButton";
import Name from "app/atoms/Name";
import HashShortView from "app/atoms/HashShortView";
import Alert from "app/atoms/Alert";

type FormData = Pick<ThanosNetwork, "name" | "rpcBaseURL" | "lambdaContract">;

const SUBMIT_ERROR_TYPE = "submit-error";
const URL_PATTERN = /^((?:http(s)?:\/\/)?[\w.-]+(?:\.[\w.-]+)+[\w\-._~:/?#[\]@!$&'()*+,;=.]+)|(http(s)?:\/\/localhost:[0-9]+)$/;

const CustomNetworksSettings: React.FC = () => {
  const { updateSettings } = useThanosClient();
  const { customNetworks = [] } = useSettings();
  const network = useNetwork();
  const [showNoLambdaWarning, setShowNoLambdaWarning] = useState(false);
  const tezos = useTezos();

  const {
    register,
    reset: resetForm,
    handleSubmit,
    formState,
    clearError,
    setError,
    errors,
  } = useForm<FormData>();
  const submitting = formState.isSubmitting;

  const onSubmit = useCallback(
    async (data: FormData) => {
      if (submitting) return;
      clearError();

      if (!showNoLambdaWarning && !data.lambdaContract) {
        setShowNoLambdaWarning(true);
        return;
      }
      setShowNoLambdaWarning(false);

      try {
        await updateSettings({
          customNetworks: [
            ...customNetworks,
            {
              ...data,
              description: data.name,
              type: "test",
              disabled: false,
              color: COLORS[Math.floor(Math.random() * COLORS.length)],
              id: data.rpcBaseURL,
            },
          ],
        });
        resetForm();
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error(err);
        }
        await new Promise((res) => setTimeout(res, 300));
        setError("rpcBaseURL", SUBMIT_ERROR_TYPE, err.message);
      }
    },
    [
      clearError,
      customNetworks,
      resetForm,
      submitting,
      setError,
      updateSettings,
      showNoLambdaWarning,
    ]
  );

  const rpcURLIsUnique = useCallback(
    (url: string) => {
      return ![...NETWORKS, ...customNetworks].some(
        ({ rpcBaseURL }) => rpcBaseURL === url
      );
    },
    [customNetworks]
  );

  const handleRemoveClick = useCallback(
    (baseUrl: string) => {
      if (!window.confirm(t("deleteNetworkConfirm"))) {
        return;
      }

      updateSettings({
        customNetworks: customNetworks.filter(
          ({ rpcBaseURL }) => rpcBaseURL !== baseUrl
        ),
      }).catch(async (err) => {
        if (process.env.NODE_ENV === "development") {
          console.error(err);
        }
        await new Promise((res) => setTimeout(res, 300));
        setError("rpcBaseURL", SUBMIT_ERROR_TYPE, err.message);
      });
    },
    [customNetworks, setError, updateSettings]
  );

  return (
    <div className="w-full max-w-sm p-2 pb-4 mx-auto">
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormField
          ref={register({ required: t("required"), maxLength: 35 })}
          label={t("name")}
          id="name"
          name="name"
          placeholder={t("networkNamePlaceholder")}
          errorCaption={errors.name?.message}
          containerClassName="mb-4"
          maxLength={35}
        />

        <FormField
          ref={register({
            required: t("required"),
            pattern: {
              value: URL_PATTERN,
              message: t("mustBeValidURL"),
            },
            validate: {
              unique: rpcURLIsUnique,
            },
          })}
          label={t("rpcBaseURL")}
          id="rpc-base-url"
          name="rpcBaseURL"
          placeholder="http://localhost:8545"
          errorCaption={
            errors.rpcBaseURL?.message ||
            (errors.rpcBaseURL?.type === "unique" ? t("mustBeUnique") : "")
          }
          containerClassName="mb-4"
        />

        <FormField
          ref={register({ validate: validateLambdaContract })}
          label={
            <>
              <T id="lambdaContract" />
              <T id="optionalComment">
                {(message) => (
                  <span className="ml-1 text-sm font-light text-gray-600">
                    {message}
                  </span>
                )}
              </T>
            </>
          }
          id="lambda-contract"
          name="lambdaContract"
          placeholder={t("lambdaContractPlaceholder")}
          errorCaption={errors.lambdaContract?.message}
          containerClassName="mb-6"
        />

        <T id="addNetwork">
          {(message) => (
            <FormSubmitButton loading={submitting}>{message}</FormSubmitButton>
          )}
        </T>
      </form>

      {showNoLambdaWarning && (
        <Alert
          className="mt-6"
          title={t("attentionExclamation")}
          description={t("noLambdaWarningContent")}
        />
      )}

      <div className="flex flex-col my-8">
        <h2 className={classNames("mb-4", "leading-tight", "flex flex-col")}>
          <T id="currentNetworks">
            {(message) => (
              <span className="text-base font-semibold text-gray-700">
                {message}
              </span>
            )}
          </T>

          <T id="deleteNetworkHint">
            {(message) => (
              <span
                className={classNames(
                  "mt-1",
                  "text-xs font-light text-gray-600"
                )}
                style={{ maxWidth: "90%" }}
              >
                {message}
              </span>
            )}
          </T>
        </h2>

        <div
          className={classNames(
            "rounded-md overflow-hidden",
            "border-2 bg-gray-100",
            "flex flex-col",
            "text-gray-700 text-sm leading-tight"
          )}
        >
          {customNetworks.map((network) => (
            <NetworksListItem
              canRemove
              network={network}
              last={false}
              key={network.rpcBaseURL}
              onRemoveClick={handleRemoveClick}
            />
          ))}
          {NETWORKS.map((network, index) => (
            <NetworksListItem
              canRemove={false}
              key={network.rpcBaseURL}
              last={index === NETWORKS.length - 1}
              network={network}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomNetworksSettings;

type NetworksListItemProps = {
  canRemove: boolean;
  network: ThanosNetwork;
  onRemoveClick?: (baseUrl: string) => void;
  last: boolean;
};

const NetworksListItem: React.FC<NetworksListItemProps> = (props) => {
  const {
    network: { name, nameI18nKey, rpcBaseURL, color, lambdaContract },
    canRemove,
    onRemoveClick,
    last,
  } = props;
  const handleRemoveClick = useCallback(() => onRemoveClick?.(rpcBaseURL), [
    onRemoveClick,
    rpcBaseURL,
  ]);

  return (
    <div
      className={classNames(
        "block w-full",
        "overflow-hidden",
        !last && "border-b border-gray-200",
        "hover:bg-gray-200 focus:bg-gray-200",
        "flex items-center",
        "text-gray-700",
        "transition ease-in-out duration-200",
        "focus:outline-none",
        "opacity-90 hover:opacity-100"
      )}
      style={{
        padding: "0.4rem 0.375rem 0.4rem 0.375rem",
      }}
    >
      <div
        className="w-3 h-3 ml-1 mr-3 border rounded-full shadow-xs border-primary-white"
        style={{ background: color }}
      />
      <div className="flex flex-col justify-between flex-1">
        <Name className="text-sm font-medium leading-tight">
          {(nameI18nKey && <T id={nameI18nKey} />) || name}
        </Name>
        <div className="mt-1 text-xs leading-none text-gray-700">
          {rpcBaseURL}
        </div>
        {lambdaContract && (
          <div className="mt-1 text-xs leading-none text-gray-700">
            <T
              id="someLambda"
              substitutions={<HashShortView hash={lambdaContract} />}
            />
          </div>
        )}
      </div>
      {canRemove && (
        <button className="flex-none" onClick={handleRemoveClick}>
          <CloseIcon
            className="w-auto h-5 mx-2 stroke-2"
            stroke="#777"
            title={t("delete")}
          />
        </button>
      )}
    </div>
  );
};

function validateLambdaContract(value: any) {
  return value ? validateContractAddress(value) : true;
}
