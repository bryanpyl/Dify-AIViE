"use client";
import React from "react";
import {
  LightError404,
  LightUnauthorized1,
} from "@/app/components/base/icons/src/public/vector-illustration";
import Button from "@/app/components/base/button";
import { useRouter } from "next/navigation";
import { errorType } from "@/types/app";
import { useTranslation } from "react-i18next";

interface ErrorProps {
  error:Error & {errorCode?:errorType};
  reset: ()=>void;
}

const ErrorPage = ({error,reset}:ErrorProps) => {
  const router = useRouter();
  const { t } = useTranslation();
  const currentErrorCode = error.errorCode || errorType.others;

  return (
    <div className="relative flex flex-col overflow-y-auto bg-background-body shrink-0 h-0 grow xl:p-14 2xl:p-48 ">
      <div className="flex flex-row p-10 rounded-lg shadow-lg shadow-gray-200 w-full h-full justify-center items-center bg-background-surface-white">
        <div className="flex-1 flex flex-col max-w-full p-8 gap-y-5">
          <div className='flex flex-col gap-y-2'>
            <p className="system-xl-semibold text-text-primary">
              {t(`error.${currentErrorCode}.title`)}
            </p>
            <h1 className="title-5xl-bold text-text-accent">
              {t(`error.${currentErrorCode}.subtitle`)}
            </h1>
          </div>
          <p className="system-md-regular text-text-tertiary w-full break-words">
            {t(`error.${currentErrorCode}.description`)}
          </p>
          <div className="flex flex-row items-center justify-start gap-x-5">
            <Button variant='primary' onClick={() => router.back()}>{t('error.actions.back')}</Button>
            {
              currentErrorCode===errorType.others && <Button onClick={()=>reset()}>Refresh Page</Button>
            }
          </div>
        </div>
        <div className="flex-1 flex max-w-full max-h-full h-full items-center justify-center">
          {currentErrorCode === errorType.unauthorized ?(
            <LightUnauthorized1 className="max-w-[80%] max-h-[80%] w-auto h-auto object-contain" />
          ):<LightError404/>}
        </div>
      </div>
    </div>
  );
};

export default React.memo(ErrorPage);
