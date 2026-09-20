import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import TextRoll from './TextRoll';

interface Props {
  to?: string;
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  size?: 'md' | 'sm';
  type?: 'button' | 'submit';
}

const press = 'transition-[transform,background-color,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97]';

function Wrap({ to, href, onClick, className, children, type = 'button' }: Props) {
  if (to) return <Link to={to} className={className} onClick={onClick}>{children}</Link>;
  if (href) return <a href={href} className={className} onClick={onClick}>{children}</a>;
  return <button type={type} onClick={onClick} className={className}>{children}</button>;
}

/** Solid forest-green pill with a small circular icon on the right edge. */
export function PrimaryButton({ size = 'md', className, children, ...rest }: Props) {
  return (
    <Wrap
      {...rest}
      className={cn(
        'roll-host group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-[#1F3D2B] font-medium text-[#FAFAF7] hover:bg-[#274B35]',
        size === 'md' ? 'py-1.5 pl-6 pr-1.5 text-[15px]' : 'py-1 pl-4 pr-1 text-sm',
        press,
        className,
      )}
    >
      {/* sweep adapted from Watermelon UI shimmer-button */}
      <span aria-hidden className="pointer-events-none absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/15 to-transparent transition-transform duration-500 ease-out group-hover:translate-x-full motion-reduce:hidden" />
      <span className="relative">{typeof children === 'string' ? <TextRoll>{children}</TextRoll> : children}</span>
      <span className={cn('relative grid place-items-center rounded-full bg-[#FAFAF7]/15', size === 'md' ? 'size-9' : 'size-7')}>
        <ArrowUpRight className={cn('transition-transform duration-200 ease-out group-hover:translate-x-px group-hover:-translate-y-px', size === 'md' ? 'size-4' : 'size-3.5')} />
      </span>
    </Wrap>
  );
}

/** Outline button: dark text, plain arrow, no fill. */
export function SecondaryButton({ className, children, ...rest }: Props) {
  return (
    <Wrap
      {...rest}
      className={cn(
        'roll-host group inline-flex items-center gap-2 rounded-full border border-[#2B2E28]/25 px-5 py-2.5 text-[15px] font-medium text-[#2B2E28] hover:border-[#2B2E28]/60',
        press,
        className,
      )}
    >
      <span>{typeof children === 'string' ? <TextRoll>{children}</TextRoll> : children}</span>
      <ArrowRight className="size-4 transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
    </Wrap>
  );
}

export function PreviewBadge({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center rounded-full bg-[#E4EBE1] px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.08em] text-[#1F3D2B]', className)}>
      Preview
    </span>
  );
}
