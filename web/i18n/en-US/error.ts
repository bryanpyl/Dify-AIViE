const translation = {
    notFound: {
      title: "Page Not Found",
      subtitle: "Requested page does not exist",
      description:
        "The page you are attempting to access could not be found. It may have been removed, renamed, or is temporarily unavailable. Please verify the URL or return to the homepage."
    },
    unauthorized: {
      title: "Access Denied",
      subtitle: "Insufficient permissions to proceed",
      description:
        "You do not have the required permissions to view this content. Please contact your administrator or supervisor to request access if you believe this is an error."
    },
    internalServerError: {
      title: "Internal Server Error",
      subtitle: "A system error has occurred",
      description:
        "An unexpected error occurred on the server while processing your request. This is not due to any action on your part. Please try again later."
    },
    others: {
      title: "Unexpected Error",
      subtitle: "An unknown error occurred",
      description:
        "The system encountered an unexpected issue that prevented the completion of your request. This may be related to connectivity, configuration, or an unforeseen error. Please try again later."
    },
    actions:{
      back:'Back to Previous Page'
    }
}

export default translation
