import { useEffect, useState, useCallback, useRef } from "react";

interface UseInfiniteScrollOptions {
  threshold?: number;
  rootMargin?: string;
}

export const useInfiniteScroll = (
  callback: () => void,
  options: UseInfiniteScrollOptions = {}
) => {
  const { threshold = 100, rootMargin = "100px" } = options;
  const [isFetching, setIsFetching] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const handleScroll = useCallback(() => {
    if (
      window.innerHeight + document.documentElement.scrollTop >=
      document.documentElement.offsetHeight - threshold
    ) {
      setIsFetching(true);
    }
  }, [threshold]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (!isFetching) return;

    callback().finally(() => setIsFetching(false));
  }, [isFetching, callback]);

  return { isFetching, setIsFetching };
};

// Alternative using IntersectionObserver API
export const useIntersectionObserver = (
  callback: () => void,
  options: UseInfiniteScrollOptions = {}
) => {
  const { rootMargin = "100px" } = options;
  const [isFetching, setIsFetching] = useState(false);
  const targetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = targetRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetching) {
          setIsFetching(true);
        }
      },
      { rootMargin }
    );

    observer.observe(element);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [rootMargin, isFetching]);

  useEffect(() => {
    if (!isFetching) return;

    callback().finally(() => setIsFetching(false));
  }, [isFetching, callback]);

  return { targetRef, isFetching, setIsFetching };
};
