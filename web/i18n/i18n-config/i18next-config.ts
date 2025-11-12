'use client'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import { LanguagesSupported } from '@/i18n/i18n-config/language'

const loadLangResources = (lang: string) => ({
  translation: {
    accountDetail: require(`../en-US/account-detail`).default,
    accountGroup: require(`../en-US/account-group`).default,
    accountMember: require(`../en-US/account-member`).default,
    accountRole: require(`../en-US/account-role`).default,
    account: require(`../en-US/account`).default,
    appAnnotation: require(`../en-US/app-annotation`).default,
    appApi: require(`../en-US/app-api`).default,
    appDebug: require(`../en-US/app-debug`).default,
    appLog: require(`../en-US/app-log`).default,
    appOverview: require(`../en-US/app-overview`).default,
    app: require(`../en-US/app`).default,
    billing: require(`../en-US/billing`).default,
    common: require(`../en-US/common`).default,
    custom: require(`../en-US/custom`).default,
    datasetCreation: require(`../en-US/dataset-creation`).default,
    datasetDocuments: require(`../en-US/dataset-documents`).default,
    datasetHitTesting: require(`../en-US/dataset-hit-testing`).default,
    datasetPipeline: require(`../en-US/dataset-pipeline`).default,
    datasetSandbox: require(`../en-US/dataset-sandbox`).default,
    datasetSettings: require(`../en-US/dataset-settings`).default,
    dataset: require(`../en-US/dataset`).default,
    education: require(`../en-US/education`).default,
    error:require(`../en-US/error`).default,
    explore: require(`../en-US/explore`).default,
    layout: require(`../en-US/layout`).default,
    login: require(`../en-US/login`).default,
    oauth: require(`../en-US/oauth`).default,
    pipeline: require(`../en-US/pipeline`).default,
    pluginTags: require(`../en-US/plugin-tags`).default,
    plugin: require(`../en-US/plugin`).default,
    register: require(`../en-US/register`).default,
    runLog: require(`../en-US/run-log`).default,
    share: require(`../en-US/share`).default,
    time: require(`../en-US/time`).default,
    tools: require(`../en-US/tools`).default,
    workflow: require(`../en-US/workflow`).default,
  },
})

// Automatically generate the resources object
const resources = LanguagesSupported.reduce((acc: any, lang: string) => {
  acc[lang] = loadLangResources(lang)
  return acc
}, {})

i18n.use(initReactI18next)
  .init({
    lng: undefined,
    fallbackLng: 'en-US',
    resources,
  })

export const changeLanguage = i18n.changeLanguage
export default i18n
