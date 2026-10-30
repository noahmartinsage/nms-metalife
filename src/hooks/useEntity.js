import { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

/**
 * 通用实体查询 Hook：自动订阅实时变更
 *
 * 返回 { data, loading, error, refresh, setData }
 * - error 不再被静默吞掉：失败时保留上一次成功数据并暴露错误，供 UI 显示重试
 *
 * @param {string} entityName 实体名
 * @param {object} query 过滤条件
 * @param {string} sort 排序（"-created_date" 为倒序）
 * @param {number} limit 条数
 */
export function useEntityList(entityName, query = {}, sort = "-created_date", limit = 200) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const key = JSON.stringify(query);

  const load = useCallback(async () => {
    try {
      const rows = await base44.entities[entityName].filter(JSON.parse(key), sort, limit);
      setData(rows);
      setError(null);
    } catch (e) {
      /* 保留旧数据并暴露错误：生产环境不能把失败当成空列表 */
      setError(e?.message || "数据加载失败");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityName, key, sort, limit]);

  useEffect(() => {
    setLoading(true);
    load();
    const unsub = base44.entities[entityName].subscribe(() => load());
    return unsub;
  }, [load, entityName]);

  return { data, loading, error, refresh: load, setData };
}

export default useEntityList;
