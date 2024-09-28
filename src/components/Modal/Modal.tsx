import { AnimatePresence, motion } from 'framer-motion';
import { ButtonHTMLAttributes } from 'react';
import { Button } from '../ui/button';

export const ModalHeader = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={`px-4 pt-4 pb-3 bg-background sm:px-6 ${className}`}>
      {children}
    </div>
  );
};

export const ModalBody = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={`px-4 py-3 mb-2 bg-background sm:px-6 ${className}`}>
      {children}
    </div>
  );
};

export const ModalFooter = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={`px-4 py-3 bg-secondary sm:px-6 ${className}`}>
      {children}
    </div>
  );
};

const modalOverlayVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
  },
};

const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.99,
  },
  visible: {
    opacity: 1,
    scale: 1,
  },
};

export const Modal = ({
  children,
  className,
  isOpen,
}: {
  children: React.ReactNode;
  className?: string;
  isOpen: boolean;
}) => {
  const wrapperClassname = isOpen
    ? 'fixed z-10 inset-0 overflow-y-auto '
    : 'fixed z-10 inset-0 overflow-y-auto hidden';
  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          transition={{
            duration: 0.15,
          }}
          variants={modalOverlayVariants}
          initial="hidden"
          animate={'visible'}
          exit={'hidden'}
          className={wrapperClassname}
        >
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div className="absolute inset-0 bg-secondary opacity-75"></div>
            </div>
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>
            <motion.div
              variants={modalVariants}
              className={`inline-block align-bottom bg-background rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ${className}`}
            >
              {children}
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
};

export const ModalSuccessButton = ({
  children,
  className,
  onClick,
  type,
}: ButtonProps) => {
  return (
    <Button
      type={type ?? 'button'}
      variant={'default'}
      className={`inline-flex justify-center px-4 py-2 text-sm font-medium ${className}`}
      onClick={onClick}
    >
      {children}
    </Button>
  );
};

export const ModalCancelButton = ({
  children,
  className,
  onClick,
}: ButtonProps) => {
  return (
    <Button
      type="button"
      variant={'secondary'}
      className={`inline-flex justify-center px-4 py-2 text-sm ${className}`}
      onClick={onClick}
    >
      {children}
    </Button>
  );
};
