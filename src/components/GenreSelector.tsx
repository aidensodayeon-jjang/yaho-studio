import { GENRES } from '../data/mockData';

interface GenreSelectorProps {
  activeGenre: string;
  setActiveGenre: (genre: string) => void;
}

export default function GenreSelector({ activeGenre, setActiveGenre }: GenreSelectorProps) {
  const displayGenres = GENRES.slice(0, 9);

  return (
    <div className="flex flex-col space-y-4 select-none mb-12">
      <div className="flex items-center space-x-2">
        <h3 className="text-xl font-semibold text-neutral-800 tracking-tight">AI MD 추천 카테고리</h3>
        <p className="text-sm text-neutral-400 font-light ml-4">
          분석하고 싶은 장르를 선택하세요.
        </p>
      </div>

      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-2">
        {displayGenres.map((genre) => {
          const isActive = activeGenre === genre.id;
          return (
            <button
              key={genre.id}
              onClick={() => setActiveGenre(genre.id)}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md scale-105'
                  : 'bg-neutral-100 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-800'
              }`}
            >
              <span className={isActive ? 'opacity-100' : 'opacity-70'}>{genre.icon}</span>
              <span>{genre.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
