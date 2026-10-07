import React from 'react';
import { MenuItem } from '../types/pos';
import { Plus, Minus, Sparkles, Utensils, CupSoda, Cookie } from 'lucide-react';
import { playTapSound } from '../utils/audio';

interface Props {
  item: MenuItem;
  quantityInCart: number;
  onAddToCart: (item: MenuItem) => void;
  onRemoveFromCart: (itemId: string) => void;
}

export const MenuCard: React.FC<Props> = ({
  item,
  quantityInCart,
  onAddToCart,
  onRemoveFromCart,
}) => {
  const handleCardClick = () => {
    playTapSound();
    onAddToCart(item);
  };

  const handleMinusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    playTapSound();
    onRemoveFromCart(item.id);
  };

  const handlePlusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    playTapSound();
    onAddToCart(item);
  };

  // Specific visual theme based on item
  const getTheme = () => {
    switch (item.id) {
      case 'churros':
        return {
          bgGradient: 'from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100',
          borderActive: 'border-amber-400 ring-2 ring-amber-300',
          iconBg: 'bg-amber-500 text-white',
          badgeBg: 'bg-amber-100 text-amber-800',
          priceColor: 'text-amber-700',
        };
      case 'ricebowl':
        return {
          bgGradient: 'from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100',
          borderActive: 'border-orange-500 ring-2 ring-orange-300',
          iconBg: 'bg-orange-600 text-white',
          badgeBg: 'bg-orange-100 text-orange-800',
          priceColor: 'text-orange-700',
        };
      case 'lemontea':
        return {
          bgGradient: 'from-yellow-50 to-emerald-50 hover:from-yellow-100 hover:to-emerald-100',
          borderActive: 'border-emerald-400 ring-2 ring-emerald-300',
          iconBg: 'bg-emerald-500 text-white',
          badgeBg: 'bg-emerald-100 text-emerald-800',
          priceColor: 'text-emerald-700',
        };
      case 'paket-hemat':
      default:
        return {
          bgGradient: 'from-purple-50 via-pink-50 to-amber-50 hover:from-purple-100 hover:to-pink-100',
          borderActive: 'border-purple-500 ring-2 ring-purple-300',
          iconBg: 'bg-gradient-to-r from-purple-600 to-pink-500 text-white',
          badgeBg: 'bg-purple-100 text-purple-900 border border-purple-200',
          priceColor: 'text-purple-700',
        };
    }
  };

  const theme = getTheme();

  const renderIcon = () => {
    switch (item.id) {
      case 'churros':
        return <Cookie className="w-8 h-8" />;
      case 'ricebowl':
        return <Utensils className="w-8 h-8" />;
      case 'lemontea':
        return <CupSoda className="w-8 h-8" />;
      case 'paket-hemat':
      default:
        return <Sparkles className="w-8 h-8" />;
    }
  };

  return (
    <div
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleCardClick();
        }
      }}
      className={`relative select-none text-left cursor-pointer rounded-2xl p-5 border transition-all duration-150 transform active:scale-95 shadow-sm hover:shadow-md flex flex-col justify-between bg-gradient-to-br ${theme.bgGradient} ${
        quantityInCart > 0 ? theme.borderActive : 'border-slate-200'
      }`}
    >
      {/* Top row: Icon & Badge */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md ${theme.iconBg}`}>
          {renderIcon()}
        </div>

        <div className="flex flex-col items-end gap-1">
          {item.badge && (
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${theme.badgeBg}`}>
              {item.badge}
            </span>
          )}
          {quantityInCart > 0 && (
            <span className="bg-slate-900 text-white text-xs font-black px-2.5 py-0.5 rounded-full shadow-xs">
              {quantityInCart}x dipilih
            </span>
          )}
        </div>
      </div>

      {/* Middle info */}
      <div className="space-y-1 mb-4">
        <h3 className="font-extrabold text-slate-900 text-lg leading-snug">
          {item.name}
        </h3>
        <p className="text-xs text-slate-600 line-clamp-2">
          {item.description}
        </p>
      </div>

      {/* Price & Quick Quantity Stepper */}
      <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between">
        <div>
          {item.originalPrice && (
            <span className="text-xs text-slate-400 line-through block font-medium">
              Rp {item.originalPrice.toLocaleString('id-ID')}
            </span>
          )}
          <span className={`text-xl font-black ${theme.priceColor}`}>
            Rp {item.price.toLocaleString('id-ID')}
          </span>
        </div>

        {/* Stepper buttons */}
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {quantityInCart > 0 ? (
            <div className="flex items-center bg-white shadow-xs border border-slate-200 rounded-xl p-1 gap-1">
              <button
                type="button"
                onClick={handleMinusClick}
                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-colors active:scale-90 font-bold"
                title="Kurangi 1"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-7 text-center font-black text-sm text-slate-800">
                {quantityInCart}
              </span>
              <button
                type="button"
                onClick={handlePlusClick}
                className="w-8 h-8 rounded-lg bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center transition-colors active:scale-90 font-bold"
                title="Tambah 1"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handlePlusClick}
              className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-1 shadow-sm active:scale-90 transition-transform"
            >
              <Plus className="w-4 h-4" />
              <span>Pilih</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
