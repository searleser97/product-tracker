while (true) do
    chromium-browser --remote-debugging-port=9222 >/dev/null 2>&1 &
    pnpm start
done