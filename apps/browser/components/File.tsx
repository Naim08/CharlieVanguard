import React, { useState } from "react";
import Modal from "react-modal";

export type FileType = {
  path: string;
  content?: Uint8Array;
};

const File = ({ file }: { file: FileType }) => {
  const [showContent, setShowContent] = useState(false);

  const handleClick = () => {
    setShowContent(true);
  };

  const handleClose = () => {
    setShowContent(false);
  };

  let contentString = "";
  if (file.content) {
    const decoder = new TextDecoder();
    contentString += `${file.path}:\n${decoder.decode(
      file.content
    )}\n--------\n`;
  }
  return (
    <>
      <div
        className="my-2.5 flex w-auto cursor-pointer items-center justify-between rounded border-2 border-zinc-500 bg-zinc-900 p-2.5 hover:border-cyan-500"
        onClick={handleClick}
      >
        {file.path}
      </div>
      <Modal
        className="fixed left-1/2 top-1/2 box-border inline-block h-3/4 w-3/4 -translate-x-1/2 -translate-y-1/2 overflow-y-scroll break-words break-all border-2 border-zinc-600 bg-zinc-900 p-8 text-zinc-100 outline-none"
        isOpen={showContent}
        onRequestClose={handleClose}
        contentLabel="File Content"
        style={{
          overlay: {
            backgroundColor: "transparent",
            backdropFilter: "blur(8px)",
          },
        }}
      >
        <button
          className="inline-block h-12 w-24 cursor-pointer rounded-xl border-none bg-cyan-500 px-6 py-2.5 text-center text-zinc-900 shadow-md outline-none transition-all hover:bg-cyan-400"
          onClick={handleClose}
        >
          Close
        </button>
        <pre>{contentString}</pre>
      </Modal>
    </>
  );
};

export default File;
