import { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

/**
 * 通用实体查询 Hook：自动订阅实时变更
 * @param {string} entityName 实体名
 * @param {object} query 过滤条件
 * @param {string} sort 排序（"-created_date" 为倒序）
 * @param {number} limit 条数
 */
export function useEntityList(entityName, query = {}, sort = "-created_date", limit = 200) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const key = JSON.stringify(query);

  const load = useCallback(async () => {
    try {
      const rows = await base44.entities[entityName].filter(JSON.parse(key), sort, limit);
      setData(rows);
    } catch (e) {
      setData([]);
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

  return { data, loading, refresh: load, setData };
}

export default useEntityList;
