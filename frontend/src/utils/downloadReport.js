import axiosInstance from "./axiosInstance";

const extractBlobErrorMessage = async (blob) => {
  if (!(blob instanceof Blob)) {
    return null;
  }

  try {
    const text = await blob.text();
    const parsed = JSON.parse(text);
    return parsed?.message || null;
  } catch {
    return null;
  }
};

export const downloadReport = async ({
  url,
  fallbackFileName = "report.xlsx",
}) => {
  try {
    const response = await axiosInstance.get(url, {
      responseType: "blob",
      timeout: 60000,
      headers: {
        Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });

    const contentDisposition = response.headers["content-disposition"] || "";
    const matchedFileName =
      contentDisposition.match(/filename="?([^"]+)"?/i)?.[1];
    const fileName = matchedFileName || fallbackFileName;

    const blob = new Blob([response.data], {
      type:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = downloadUrl;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    const parsedMessage = await extractBlobErrorMessage(error?.response?.data);

    if (parsedMessage) {
      error.message = parsedMessage;
    }

    throw error;
  }
};
