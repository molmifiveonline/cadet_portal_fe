import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MenuItems } from '../../lib/utils/menu';

const TitleManager = () => {
  const location = useLocation();

  useEffect(() => {
    const baseTitle = 'MOLMI NAVIS';
    const path = location.pathname;

    // 1. Check for exact match first
    let currentItem = null;
    for (const item of MenuItems) {
      if (item.url === path) {
        currentItem = item;
        break;
      }
      if (item.subItems) {
        const subItem = item.subItems.find((sub) => sub.url === path);
        if (subItem) {
          currentItem = subItem;
          break;
        }
      }
    }

    // 2. If no exact match, try prefix match (for forms like /users/add)
    if (!currentItem) {
      for (const item of MenuItems) {
        if (
          item.url !== '/' &&
          item.url !== '/dashboard' &&
          path.startsWith(item.url)
        ) {
          currentItem = item;
          break;
        }
      }
    }

    if (!currentItem || currentItem.url === '/dashboard') {
      document.title = baseTitle;
    } else {
      document.title = `${baseTitle} || ${currentItem.title}`;
    }
  }, [location]);

  return null;
};

export default TitleManager;
