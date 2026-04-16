import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'ghost' | 'outline-light' | 'primary-light' | 'destructive' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'xl';
  asChild?: boolean;
};

const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}) => {
  const base =
    'inline-flex items-center justify-center font-black tracking-tight ' +
    'transition-all duration-150 ' +
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 ' +
    'disabled:opacity-50 disabled:pointer-events-none rounded-2xl';

  const variants: Record<string, string> = {
    default:
      'bg-gradient-to-r from-purple-600 to-blue-500 text-white font-black rounded-2xl ' +
      'hover:opacity-90 hover:shadow-lg hover:-translate-y-px',
    outline:
      'border-2 border-purple-200 bg-white text-purple-700 font-black rounded-2xl ' +
      'hover:bg-purple-50 hover:border-purple-400 hover:text-purple-900',
    'outline-light':
      'border-2 border-white text-white font-black rounded-2xl hover:bg-white/15 hover:border-white/90',
    ghost:
      'text-purple-600 font-black hover:bg-purple-50 hover:text-purple-900',
    'primary-light':
      'bg-white text-purple-700 font-black rounded-2xl hover:bg-purple-50 hover:shadow-sm',
    destructive:
      'bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 hover:-translate-y-px hover:shadow-md',
    link:
      'text-purple-600 underline-offset-4 hover:underline font-black p-0 h-auto',
  };

  const sizes: Record<string, string> = {
    default: 'h-10 py-2 px-4 text-sm',
    sm:      'h-9 px-3 text-xs',
    lg:      'h-11 px-8 text-base',
    icon:    'h-10 w-10',
    xl:      'h-auto px-8 py-4 text-lg',
  };

  const cls = [base, variants[variant], sizes[size], className].filter(Boolean).join(' ');

  if (asChild) {
    if (React.Children.count(children) !== 1 || !React.isValidElement(children)) {
      return <>{children}</>;
    }
    const child = children as React.ReactElement<any>;
    return React.cloneElement(child, {
      ...props,
      className: [cls, child.props.className].filter(Boolean).join(' '),
    });
  }

  return <button className={cls} {...props}>{children}</button>;
};

export { Button };
