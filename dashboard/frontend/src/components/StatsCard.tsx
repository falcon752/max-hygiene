import styles from './StatsCard.module.css';

interface Props {
  title: string;
  value: string | number;
  icon: string;
  color?: 'primary' | 'secondary' | 'danger' | 'warning';
  trend?: { value: number; label: string };
}

export default function StatsCard({ title, value, icon, color = 'primary', trend }: Props) {
  return (
    <div className={styles.card}>
      <div className={`${styles.icon} ${styles[color]}`}>
        <i className={icon} />
      </div>
      <div className={styles.content}>
        <p className={styles.title}>{title}</p>
        <p className={styles.value}>{value}</p>
        {trend && (
          <p className={`${styles.trend} ${trend.value >= 0 ? styles.up : styles.down}`}>
            <i className={trend.value >= 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down'} />
            {Math.abs(trend.value)} {trend.label}
          </p>
        )}
      </div>
    </div>
  );
}
