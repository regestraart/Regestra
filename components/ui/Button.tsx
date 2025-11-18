import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'ghost' | 'outline-light' | 'primary-light' | 'destructive' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'xl';
};

const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'default',
  size = 'default',
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none rounded-md';

  const variantClasses = {
    default: 'bg-gradient-to-r from-purple-600 to-blue-500 text-white hover:opacity-90',
    outline: 'border border-gray-300 bg-transparent hover:bg-gray-100',
    'outline-light': 'border-2 border-white text-white hover:bg-white/10',
    ghost: 'hover:bg-gray-100',
    'primary-light': 'bg-white text-purple-600 hover:bg-gray-100',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
    link: 'text-purple-600 underline-offset-4 hover:underline',
  };

  const sizeClasses = {
    default: 'h-10 py-2 px-4',
    sm: 'h-9 px-3',
    lg: 'h-11 px-8',
    icon: 'h-10 w-10',
    xl: 'h-auto px-8 py-4 text-lg',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export { Button };