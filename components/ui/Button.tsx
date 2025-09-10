import React from 'react';

type Variant = 'primary' | 'emphasis' | 'secondary' | 'tertiary' | 'ghost' | 'accent';
type Size = 'icon' | 'sm' | 'md';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

const variantClasses: Record<Variant, string> = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-500 focus:ring-indigo-500',
  emphasis: 'bg-indigo-500 text-white hover:bg-indigo-400 focus:ring-indigo-400',
  secondary: 'bg-indigo-100 text-indigo-700 border border-indigo-200 hover:bg-indigo-200/60 focus:ring-indigo-200',
  tertiary: 'text-indigo-600 hover:bg-indigo-50 focus:ring-indigo-300',
  ghost: 'text-indigo-600 hover:bg-indigo-50 border border-transparent focus:ring-indigo-300',
  accent: 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500',
};

const sizeClasses: Record<Size, string> = {
  icon: 'p-1.5 rounded-md',
  sm: 'px-2.5 py-1.5 rounded-md text-sm',
  md: 'px-3 py-2 rounded-md text-sm md:text-base',
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'sm', className, children, ...rest }) => {
  return (
    <button
      className={cn(
        'inline-flex items-center gap-2 transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
};

export default Button;
