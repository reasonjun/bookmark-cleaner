import './Spinner.css';

export interface SpinnerProps {
  /** 크기 */
  size?: 'small' | 'medium' | 'large' | number;
  /** 색상 테마 */
  variant?: 'primary' | 'secondary' | 'white';
  /** 두께 */
  thickness?: number;
  /** aria-label */
  ariaLabel?: string;
}

export const Spinner = ({
  size = 'medium',
  variant = 'primary',
  thickness = 2,
  ariaLabel = 'Loading...',
}: SpinnerProps) => {
  const sizeMap = {
    small: 16,
    medium: 24,
    large: 32,
  };

  const actualSize =
    typeof size === 'number' ? size : sizeMap[size as keyof typeof sizeMap];

  return (
    <div
      className={`spinner spinner--${variant}`}
      style={{
        width: `${actualSize}px`,
        height: `${actualSize}px`,
        borderWidth: `${thickness}px`,
      }}
      role="status"
      aria-label={ariaLabel}
    ></div>
  );
};
