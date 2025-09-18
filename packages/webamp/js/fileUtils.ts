import invariant from "invariant";
import { IMetadataApi } from "./types";
import { IAudioMetadata } from "music-metadata-browser"; // Import music-metadata type definitions
import * as Utils from "./utils";

type MediaDataType = string | ArrayBuffer | Blob;

export async function genMediaTags(
  file: MediaDataType,
  musicMetadata: IMetadataApi
): Promise<IAudioMetadata> {
  invariant(
    file != null,
    "Attempted to get the tags of media file without passing a file"
  );

  const options = {
    duration: true,
    skipPostHeaders: true, // avoid unnecessary data to be read
  };

  if (typeof file === "string") {
    if (
      "parseWebStream" in musicMetadata &&
      typeof musicMetadata.parseWebStream === "function"
    ) {
      const response = await fetch(file);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch URL: ${file}, status: ${response.status}`
        );
      }

      // https://github.com/Borewit/music-metadata/issues/2455
      // There's currently an issue where some URLs will fail to parse id3 tags
      // when using parseWebStream. This approach can work around it. However,
      // My current assumption is that this is an issue mostly specific to that
      // individual file and not a wide spread issue, but if we find it happens
      // more broadly we can deopt to using parseBlob as below.

      // const blob = await response.blob();
      // return musicMetadata.parseBlob(blob, options);

      const webStream = response.body;
      if (webStream == null) {
        throw new Error("Response body is null, cannot parse metadata.");
      }
      return musicMetadata.parseWebStream(webStream, undefined, options);
    }
    if (
      "fetchFromUrl" in musicMetadata &&
      typeof musicMetadata.fetchFromUrl === "function"
    ) {
      return musicMetadata.fetchFromUrl(file, options);
    }
    throw new Error("No suitable method available to parse URL");
  }
  // Assume Blob
  return musicMetadata.parseBlob(file as Blob, options);
}

export function genMediaDuration(url: string): Promise<number> {
  invariant(
    typeof url === "string",
    "Attempted to get the duration of media file without passing a url"
  );
  return new Promise((resolve, reject) => {
    // TODO: Does this actually stop downloading the file once it's
    // got the duration?
    const audio = document.createElement("audio");
    audio.crossOrigin = "anonymous";

    const durationChange = () => {
      resolve(audio.duration);
      audio.removeEventListener("durationchange", durationChange);
      audio.removeEventListener("error", errorHandler);
      audio.src = "";
      // TODO: Not sure if this really gets cleaned up.
    };

    const errorHandler = (e: Event) => {
      audio.removeEventListener("durationchange", durationChange);
      audio.removeEventListener("error", errorHandler);
      reject(e);
    };

    audio.addEventListener("durationchange", durationChange);
    audio.addEventListener("error", errorHandler);
    audio.src = url;
  });
}

export async function genArrayBufferFromFileReference(
  fileReference: File
): Promise<any> {
  invariant(
    fileReference != null,
    "Attempt to get an ArrayBuffer without assigning a fileReference"
  );
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as ArrayBuffer);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(fileReference);
  });
}

export async function genStringFromFileReference(
  fileReference: File
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsText(fileReference);
  });
}

interface PromptForFileReferenceOptions {
  accept?: string | null;
  directory?: boolean;
}

export async function promptForFileReferences(
  { accept, directory = false }: PromptForFileReferenceOptions = {
    accept: null,
    directory: false,
  }
): Promise<FileList> {
  return new Promise<FileList>((resolve) => {
    // Does this represent a memory leak somehow?
    // Can this fail? Do we ever reject?
    const fileInput = document.createElement("input");
    if (accept) fileInput.setAttribute("accept", accept);
    fileInput.type = "file";
    fileInput.multiple = true;
    // @ts-ignore Non-standard
    fileInput.webkitdirectory = directory;
    // @ts-ignore Non-standard
    fileInput.directory = directory;
    // @ts-ignore Non-standard
    fileInput.mozdirectory = directory;
    // Not entirely sure why this is needed, since the input
    // was just created, but somehow this helps prevent change
    // events from getting swallowed.
    // https://stackoverflow.com/a/12102992/1263117

    // @ts-ignore Technically you can't set this to null, it has to be a string.
    // But I don't feel like retesting it, so I'll leave it as null
    fileInput.value = null;
    fileInput.addEventListener("change", (e: Event) => {
      const files = (<HTMLInputElement>e.target).files;
      resolve(files as FileList);
    });
    fileInput.click();
  });
}

function urlIsBlobUrl(url: string): boolean {
  return /^blob:/.test(url);
}

export function curUrlFromByteArray(arr: Uint8Array) {
  const base64 = Utils.base64FromDataArray(arr);
  return `data:image/x-win-bitmap;base64,${base64}`;
}

// This is not perfect, but... meh: https://stackoverflow.com/a/36756650/1263117
export function filenameFromUrl(url: string): string | null {
  if (urlIsBlobUrl(url)) {
    return null;
  }

  const lastSegment = url.split("/").pop();
  if (lastSegment == null) {
    return null;
  }
  return lastSegment.split("#")[0].split("?")[0];
}
