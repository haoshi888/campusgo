import { useEffect, useRef } from 'react'
import { track } from '../lib/analytics'

export function useProductExposure(containerRef: React.RefObject<HTMLElement>, productIds: string[], enabled = true) {
  const observedRef = useRef(new Set<string>())

  useEffect(() => {
    if (!enabled || !containerRef.current || productIds.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const element = entry.target as HTMLElement
          const productId = element.dataset.productId
          if (!productId || observedRef.current.has(productId)) return
          observedRef.current.add(productId)
          observer.unobserve(element)
          void track('expose_product', {
            productId,
            metadata: { position: Array.from(containerRef.current?.querySelectorAll('[data-product-id]') || []).indexOf(element) },
            onceKey: `expose-${location.pathname}-${productId}`,
          })
        })
      },
      { threshold: 0.45, rootMargin: '0px 0px -8% 0px' },
    )

    const nodes = containerRef.current.querySelectorAll('[data-product-id]')
    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [containerRef, enabled, productIds])
}
